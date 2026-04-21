import 'package:flutter/material.dart';
import '../app_theme.dart';
import '../models/player.dart';

class CourtWidget extends StatelessWidget {
  final List<Player> players;
  final void Function(int index)? onPlayerTap;

  const CourtWidget({super.key, required this.players, this.onPlayerTap});

  @override
  Widget build(BuildContext context) {
    Widget slot(int posIndex) {
      final player = posIndex < players.length ? players[posIndex] : null;
      final posNum = posIndex + 1;
      return Expanded(
        child: GestureDetector(
          onTap: onPlayerTap != null ? () => onPlayerTap!(posIndex) : null,
          child: Container(
            margin: const EdgeInsets.all(5),
            height: 86,
            decoration: BoxDecoration(
              gradient: player != null
                  ? const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [Color(0xFFFF6B35), Color(0xFFFF8C5A)],
                    )
                  : null,
              color: player == null ? Colors.white.withValues(alpha: 0.12) : null,
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
              border: Border.all(
                color: player != null ? Colors.transparent : Colors.white.withValues(alpha: 0.2),
              ),
              boxShadow: player != null
                  ? [BoxShadow(color: AppColors.orange.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
                  : null,
            ),
            child: Stack(
              children: [
                if (player == null)
                  Positioned(
                    top: 6,
                    right: 8,
                    child: Text('$posNum', style: const TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.w700)),
                  ),
                Center(
                  child: player != null
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              width: 28,
                              height: 28,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.25),
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(
                                  '#${player.jerseyNumber}',
                                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 10),
                                ),
                              ),
                            ),
                            const SizedBox(height: 5),
                            Text(
                              player.name.split(' ').first,
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                            Text(
                              'P$posNum',
                              style: const TextStyle(color: Colors.white60, fontSize: 9),
                            ),
                          ],
                        )
                      : const Icon(Icons.add_rounded, color: Colors.white24, size: 22),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1B5E20), Color(0xFF2E7D32), Color(0xFF388E3C)],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        boxShadow: [
          BoxShadow(color: AppColors.green.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6)),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          // Net
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
            height: 6,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(3),
              border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
            ),
            child: Center(
              child: Text(
                '━━━  N E T  ━━━',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 8,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 3,
                ),
              ),
            ),
          ),
          const SizedBox(height: 4),
          // Front row: positions 4, 3, 2 (indices 3, 2, 1)
          Row(children: [slot(3), slot(2), slot(1)]),
          const SizedBox(height: 2),
          // Centerline
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Row(children: List.generate(6, (i) => Expanded(child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 2),
              height: 1,
              color: Colors.white.withValues(alpha: 0.1),
            )))),
          ),
          const SizedBox(height: 2),
          // Back row: positions 5, 6, 1 (indices 4, 5, 0)
          Row(children: [slot(4), slot(5), slot(0)]),
        ],
      ),
    );
  }
}
