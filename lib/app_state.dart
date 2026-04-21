import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:uuid/uuid.dart';
import 'models/player.dart';
import 'models/lineup.dart';

const _uuid = Uuid();

class GameState {
  int homeScore;
  int awayScore;
  int homeTimeouts;
  int awayTimeouts;
  Lineup? activeLineup;
  List<Player> courtPlayers;

  GameState({
    this.homeScore = 0,
    this.awayScore = 0,
    this.homeTimeouts = 2,
    this.awayTimeouts = 2,
    this.activeLineup,
    List<Player>? courtPlayers,
  }) : courtPlayers = courtPlayers ?? [];

  void reset() {
    homeScore = 0;
    awayScore = 0;
    homeTimeouts = 2;
    awayTimeouts = 2;
    if (activeLineup != null) {
      courtPlayers = activeLineup!.sortedSlots.map((s) => s.player).toList();
    }
  }
}

class AppState extends ChangeNotifier {
  final _auth = FirebaseAuth.instance;
  final _db = FirebaseFirestore.instance;
  GoogleSignIn? _googleSignIn;

  User? _firebaseUser;
  String _userName = 'Coach';
  bool _loading = false;
  String? _authError;

  final List<Player> _players = [];
  final List<Lineup> _lineups = [];
  final GameState game = GameState();

  StreamSubscription<QuerySnapshot>? _playersSub;
  StreamSubscription<QuerySnapshot>? _lineupsSub;

  bool get isLoggedIn => _firebaseUser != null;
  String get userName => _userName;
  bool get loading => _loading;
  String? get authError => _authError;
  List<Player> get players => List.unmodifiable(_players);
  List<Lineup> get lineups => List.unmodifiable(_lineups);

  AppState() {
    _auth.authStateChanges().listen((user) {
      _firebaseUser = user;
      if (user != null) {
        _userName = user.displayName ?? user.email?.split('@').first ?? 'Coach';
        _subscribeToData();
      } else {
        _cancelSubscriptions();
        _players.clear();
        _lineups.clear();
      }
      notifyListeners();
    });
  }

  // ─── Firestore paths ────────────────────────────────────────────────────────

  CollectionReference get _playersRef =>
      _db.collection('users').doc(_firebaseUser!.uid).collection('players');

  CollectionReference get _lineupsRef =>
      _db.collection('users').doc(_firebaseUser!.uid).collection('lineups');

  // ─── Realtime listeners ─────────────────────────────────────────────────────

  void _subscribeToData() {
    _playersSub = _playersRef
        .orderBy('name')
        .snapshots()
        .listen((snap) {
      _players.clear();
      for (final doc in snap.docs) {
        _players.add(Player.fromMap(doc.id, doc.data() as Map<String, dynamic>));
      }
      notifyListeners();
    });

    _lineupsSub = _lineupsRef
        .orderBy('title')
        .snapshots()
        .listen((snap) {
      _lineups.clear();
      for (final doc in snap.docs) {
        _lineups.add(Lineup.fromMap(doc.id, doc.data() as Map<String, dynamic>));
      }
      notifyListeners();
    });
  }

  void _cancelSubscriptions() {
    _playersSub?.cancel();
    _lineupsSub?.cancel();
    _playersSub = null;
    _lineupsSub = null;
  }

  // ─── Auth ────────────────────────────────────────────────────────────────────

  Future<void> signInWithEmail(String email, String password) async {
    _setLoading(true);
    try {
      await _auth.signInWithEmailAndPassword(email: email, password: password);
      _authError = null;
    } on FirebaseAuthException catch (e) {
      _authError = _friendlyAuthError(e.code);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> createAccount(String name, String email, String password) async {
    _setLoading(true);
    try {
      final cred = await _auth.createUserWithEmailAndPassword(
          email: email, password: password);
      await cred.user?.updateDisplayName(name.isNotEmpty ? name : 'Coach');
      _authError = null;
    } on FirebaseAuthException catch (e) {
      _authError = _friendlyAuthError(e.code);
    } finally {
      _setLoading(false);
    }
  }

  Future<void> signInWithGoogle() async {
    _setLoading(true);
    try {
      _googleSignIn ??= GoogleSignIn();
      final googleUser = await _googleSignIn!.signIn();
      if (googleUser == null) { _setLoading(false); return; }
      final googleAuth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      await _auth.signInWithCredential(credential);
      _authError = null;
    } on FirebaseAuthException catch (e) {
      _authError = _friendlyAuthError(e.code);
    } catch (_) {
      _authError = 'Google sign-in failed. Try email instead.';
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _googleSignIn?.signOut();
    await _auth.signOut();
  }

  String _friendlyAuthError(String code) {
    switch (code) {
      case 'user-not-found': return 'No account found with that email.';
      case 'wrong-password': return 'Incorrect password.';
      case 'email-already-in-use': return 'An account already exists with this email.';
      case 'weak-password': return 'Password must be at least 6 characters.';
      case 'invalid-email': return 'Please enter a valid email address.';
      default: return 'Authentication failed. Please try again.';
    }
  }

  void _setLoading(bool v) { _loading = v; notifyListeners(); }

  // ─── Roster ──────────────────────────────────────────────────────────────────

  Future<void> addPlayer(String name, String position, int jerseyNumber) async {
    final id = _uuid.v4();
    await _playersRef.doc(id).set(
      Player(id: id, name: name, position: position, jerseyNumber: jerseyNumber).toMap(),
    );
  }

  Future<void> updatePlayer(
      String id, String name, String position, int jerseyNumber) async {
    await _playersRef.doc(id).update({'name': name, 'position': position, 'jerseyNumber': jerseyNumber});
  }

  Future<void> deletePlayer(String id) async {
    await _playersRef.doc(id).delete();
  }

  // ─── Lineups ─────────────────────────────────────────────────────────────────

  Future<void> saveLineup(String title, List<LineupSlot> slots) async {
    final id = _uuid.v4();
    await _lineupsRef.doc(id).set(Lineup(id: id, title: title, slots: slots).toMap());
  }

  Future<void> deleteLineup(String id) async {
    await _lineupsRef.doc(id).delete();
  }

  // ─── Game (in-memory — resets each set by design) ────────────────────────────

  void setActiveLineup(Lineup lineup) {
    game.activeLineup = lineup;
    game.courtPlayers = lineup.sortedSlots.map((s) => s.player).toList();
    notifyListeners();
  }

  void changeHomeScore(int delta) {
    game.homeScore = (game.homeScore + delta).clamp(0, 999);
    notifyListeners();
  }

  void changeAwayScore(int delta) {
    game.awayScore = (game.awayScore + delta).clamp(0, 999);
    notifyListeners();
  }

  void useTimeout(bool isHome) {
    if (isHome && game.homeTimeouts > 0) game.homeTimeouts--;
    if (!isHome && game.awayTimeouts > 0) game.awayTimeouts--;
    notifyListeners();
  }

  void rotateForward() {
    if (game.courtPlayers.length == 6) {
      final last = game.courtPlayers.removeLast();
      game.courtPlayers.insert(0, last);
      notifyListeners();
    }
  }

  void rotateBackward() {
    if (game.courtPlayers.length == 6) {
      final first = game.courtPlayers.removeAt(0);
      game.courtPlayers.add(first);
      notifyListeners();
    }
  }

  void changeStat(Player player, String stat, int delta) {
    final p = _players.firstWhere((pl) => pl.id == player.id, orElse: () => player);
    switch (stat) {
      case 'kills': p.stats.kills = (p.stats.kills + delta).clamp(0, 999);
      case 'digs': p.stats.digs = (p.stats.digs + delta).clamp(0, 999);
      case 'aces': p.stats.aces = (p.stats.aces + delta).clamp(0, 999);
      case 'errors': p.stats.errors = (p.stats.errors + delta).clamp(0, 999);
    }
    notifyListeners();
  }

  void endSet() {
    game.reset();
    for (final p in _players) { p.stats.reset(); }
    notifyListeners();
  }

  // ─── Settings ────────────────────────────────────────────────────────────────

  Future<void> resetAllData() async {
    final batch = _db.batch();
    final players = await _playersRef.get();
    final lineups = await _lineupsRef.get();
    for (final doc in players.docs) { batch.delete(doc.reference); }
    for (final doc in lineups.docs) { batch.delete(doc.reference); }
    await batch.commit();
    game.reset();
    notifyListeners();
  }

  @override
  void dispose() {
    _cancelSubscriptions();
    super.dispose();
  }
}
