class PlayerPosition {
  static const String setter = 'Setter';
  static const String middleBlocker = 'Middle Blocker';
  static const String outside = 'Outside Hitter';
  static const String libero = 'Libero';
  static const String opposite = 'Opposite';

  static List<String> get all => [setter, middleBlocker, outside, libero, opposite];
}

class PlayerStats {
  int kills;
  int digs;
  int aces;
  int errors;

  PlayerStats({this.kills = 0, this.digs = 0, this.aces = 0, this.errors = 0});

  void reset() {
    kills = 0;
    digs = 0;
    aces = 0;
    errors = 0;
  }

  PlayerStats copy() => PlayerStats(kills: kills, digs: digs, aces: aces, errors: errors);
}

class Player {
  final String id;
  String name;
  String position;
  int jerseyNumber;
  PlayerStats stats;

  Player({
    required this.id,
    required this.name,
    required this.position,
    required this.jerseyNumber,
    PlayerStats? stats,
  }) : stats = stats ?? PlayerStats();

  Player copyWith({String? name, String? position, int? jerseyNumber}) {
    return Player(
      id: id,
      name: name ?? this.name,
      position: position ?? this.position,
      jerseyNumber: jerseyNumber ?? this.jerseyNumber,
      stats: stats.copy(),
    );
  }

  Map<String, dynamic> toMap() => {
    'name': name,
    'position': position,
    'jerseyNumber': jerseyNumber,
  };

  factory Player.fromMap(String id, Map<String, dynamic> map) => Player(
    id: id,
    name: map['name'] as String,
    position: map['position'] as String,
    jerseyNumber: (map['jerseyNumber'] as num).toInt(),
  );
}
