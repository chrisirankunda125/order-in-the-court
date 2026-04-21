import 'package:flutter/foundation.dart';
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
  List<Player> courtPlayers; // ordered by current rotation position 1–6

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
  bool _isLoggedIn = false;
  String _userName = 'Coach';

  final List<Player> _players = [];
  final List<Lineup> _lineups = [];
  final GameState game = GameState();

  bool get isLoggedIn => _isLoggedIn;
  String get userName => _userName;
  List<Player> get players => List.unmodifiable(_players);
  List<Lineup> get lineups => List.unmodifiable(_lineups);

  AppState() {
    _seedData();
  }

  void _seedData() {
    final danny = Player(id: _uuid.v4(), name: 'Danny', position: PlayerPosition.setter, jerseyNumber: 7);
    final sophie = Player(id: _uuid.v4(), name: 'Sophie', position: PlayerPosition.middleBlocker, jerseyNumber: 16);
    final grace = Player(id: _uuid.v4(), name: 'Grace', position: PlayerPosition.outside, jerseyNumber: 3);
    final lauren = Player(id: _uuid.v4(), name: 'Lauren', position: PlayerPosition.libero, jerseyNumber: 5);
    final mia = Player(id: _uuid.v4(), name: 'Mia', position: PlayerPosition.opposite, jerseyNumber: 10);
    final jade = Player(id: _uuid.v4(), name: 'Jade', position: PlayerPosition.outside, jerseyNumber: 22);

    _players.addAll([danny, sophie, grace, lauren, mia, jade]);

    final lineup2 = Lineup(
      id: _uuid.v4(),
      title: 'Starting Lineup',
      slots: [
        LineupSlot(player: mia, courtPosition: 1),
        LineupSlot(player: danny, courtPosition: 2),
        LineupSlot(player: grace, courtPosition: 3),
        LineupSlot(player: lauren, courtPosition: 4),
        LineupSlot(player: jade, courtPosition: 5),
        LineupSlot(player: sophie, courtPosition: 6),
      ],
    );
    _lineups.add(lineup2);
  }

  // Auth
  void login(String name) {
    _isLoggedIn = true;
    _userName = name.isNotEmpty ? name : 'Coach';
    notifyListeners();
  }

  void logout() {
    _isLoggedIn = false;
    notifyListeners();
  }

  // Roster
  void addPlayer(String name, String position, int jerseyNumber) {
    _players.add(Player(
      id: _uuid.v4(),
      name: name,
      position: position,
      jerseyNumber: jerseyNumber,
    ));
    notifyListeners();
  }

  void updatePlayer(String id, String name, String position, int jerseyNumber) {
    final index = _players.indexWhere((p) => p.id == id);
    if (index != -1) {
      _players[index] = _players[index].copyWith(
        name: name,
        position: position,
        jerseyNumber: jerseyNumber,
      );
      notifyListeners();
    }
  }

  void deletePlayer(String id) {
    _players.removeWhere((p) => p.id == id);
    notifyListeners();
  }

  // Lineups
  void saveLineup(String title, List<LineupSlot> slots) {
    _lineups.add(Lineup(id: _uuid.v4(), title: title, slots: slots));
    notifyListeners();
  }

  void deleteLineup(String id) {
    _lineups.removeWhere((l) => l.id == id);
    notifyListeners();
  }

  // Game
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
    if (isHome && game.homeTimeouts > 0) {
      game.homeTimeouts--;
    } else if (!isHome && game.awayTimeouts > 0) {
      game.awayTimeouts--;
    }
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
      case 'kills':
        p.stats.kills = (p.stats.kills + delta).clamp(0, 999);
      case 'digs':
        p.stats.digs = (p.stats.digs + delta).clamp(0, 999);
      case 'aces':
        p.stats.aces = (p.stats.aces + delta).clamp(0, 999);
      case 'errors':
        p.stats.errors = (p.stats.errors + delta).clamp(0, 999);
    }
    notifyListeners();
  }

  void endSet() {
    game.reset();
    for (final p in _players) {
      p.stats.reset();
    }
    notifyListeners();
  }

  void resetAll() {
    _players.clear();
    _lineups.clear();
    game.reset();
    _seedData();
    notifyListeners();
  }
}
