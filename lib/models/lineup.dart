import 'player.dart';

class LineupSlot {
  Player player;
  int courtPosition;

  LineupSlot({required this.player, required this.courtPosition});

  Map<String, dynamic> toMap() => {
    'courtPosition': courtPosition,
    'playerId': player.id,
    'playerName': player.name,
    'playerPosition': player.position,
    'playerJersey': player.jerseyNumber,
  };

  factory LineupSlot.fromMap(Map<String, dynamic> map) => LineupSlot(
    courtPosition: (map['courtPosition'] as num).toInt(),
    player: Player(
      id: map['playerId'] as String,
      name: map['playerName'] as String,
      position: map['playerPosition'] as String,
      jerseyNumber: (map['playerJersey'] as num).toInt(),
    ),
  );
}

class Lineup {
  final String id;
  String title;
  List<LineupSlot> slots;

  Lineup({required this.id, required this.title, required this.slots});

  List<LineupSlot> get sortedSlots =>
      List.from(slots)..sort((a, b) => a.courtPosition.compareTo(b.courtPosition));

  Map<String, dynamic> toMap() => {
    'title': title,
    'slots': slots.map((s) => s.toMap()).toList(),
  };

  factory Lineup.fromMap(String id, Map<String, dynamic> map) => Lineup(
    id: id,
    title: map['title'] as String,
    slots: (map['slots'] as List<dynamic>)
        .map((s) => LineupSlot.fromMap(s as Map<String, dynamic>))
        .toList(),
  );
}
