import 'player.dart';

class LineupSlot {
  Player player;
  int courtPosition; // 1–6

  LineupSlot({required this.player, required this.courtPosition});
}

class Lineup {
  final String id;
  String title;
  List<LineupSlot> slots;

  Lineup({required this.id, required this.title, required this.slots});

  List<LineupSlot> get sortedSlots =>
      List.from(slots)..sort((a, b) => a.courtPosition.compareTo(b.courtPosition));
}
