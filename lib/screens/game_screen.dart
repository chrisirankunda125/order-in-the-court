import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../app_theme.dart';
import '../models/player.dart';
import '../widgets/court_widget.dart';

class GameScreen extends StatefulWidget {
  const GameScreen({super.key});

  @override
  State<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends State<GameScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFFE64A19), Color(0xFFFF6B35), Color(0xFFFF8A50)],
            ),
          ),
        ),
        title: const Row(
          children: [
            Text('🏐', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text('Game Screen', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton.icon(
              onPressed: () => _confirmEndSet(context, state),
              icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
              label: const Text('End Set', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
              style: TextButton.styleFrom(
                backgroundColor: Colors.white.withValues(alpha: 0.15),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
            ),
          ),
        ],
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Live Game', icon: Icon(Icons.sports_volleyball, size: 18)),
            Tab(text: 'Stats', icon: Icon(Icons.bar_chart_rounded, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _LiveGameTab(state: state),
          _StatsTab(state: state),
        ],
      ),
    );
  }

  Future<void> _confirmEndSet(BuildContext context, AppState state) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusLarge)),
        title: const Row(
          children: [
            Text('🔄', style: TextStyle(fontSize: 22)),
            SizedBox(width: 10),
            Text('End Set', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        content: const Text('This resets scores, rotations, and stats.\nRoster and lineups are preserved.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.orange),
            child: const Text('End Set'),
          ),
        ],
      ),
    );
    if (confirmed == true) state.endSet();
  }
}

class _LiveGameTab extends StatelessWidget {
  final AppState state;
  const _LiveGameTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final game = state.game;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      child: Column(
        children: [
          if (game.activeLineup == null) _LineupSelector(state: state),
          _ScoreBoard(game: game, state: state),
          if (game.courtPlayers.isNotEmpty) ...[
            const SizedBox(height: 20),
            Row(
              children: [
                const Text('Court View', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const Spacer(),
                if (game.activeLineup != null)
                  GestureDetector(
                    onTap: () => state.setActiveLineup(game.activeLineup!),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.green.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text('Change', style: TextStyle(color: AppColors.green, fontSize: 12, fontWeight: FontWeight.w600)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 10),
            CourtWidget(players: game.courtPlayers),
            const SizedBox(height: 14),
            _RotationControls(state: state),
          ],
        ],
      ),
    );
  }
}

class _LineupSelector extends StatelessWidget {
  final AppState state;
  const _LineupSelector({required this.state});

  @override
  Widget build(BuildContext context) {
    if (state.lineups.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: AppTheme.cardDecoration(),
        child: Column(
          children: [
            const Text('📋', style: TextStyle(fontSize: 36)),
            const SizedBox(height: 8),
            const Text('No lineups saved', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 4),
            const Text('Go to Lineups to build one first.', style: TextStyle(color: Colors.grey, fontSize: 13)),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: () => Navigator.pop(context), child: const Text('Go Back')),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: AppTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Select Starting Lineup', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
          const SizedBox(height: 12),
          ...state.lineups.map((lineup) => Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: InkWell(
              onTap: () => state.setActiveLineup(lineup),
              borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade200),
                  borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                ),
                child: Row(
                  children: [
                    const CircleAvatar(
                      radius: 16,
                      backgroundColor: Color(0xFF6A1B9A),
                      child: Icon(Icons.grid_view, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(lineup.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                          Text('${lineup.slots.length} players', style: const TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppColors.orange,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Use', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
                    ),
                  ],
                ),
              ),
            ),
          )),
        ],
      ),
    );
  }
}

class _ScoreBoard extends StatelessWidget {
  final GameState game;
  final AppState state;
  const _ScoreBoard({required this.game, required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1A237E), Color(0xFF283593), Color(0xFF303F9F)],
        ),
        borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
        boxShadow: [
          BoxShadow(color: const Color(0xFF1A237E).withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8)),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        children: [
          const Text('SCOREBOARD', style: TextStyle(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 2)),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _ScoreSide(
                label: 'HOME',
                score: game.homeScore,
                timeouts: game.homeTimeouts,
                onPlus: () => state.changeHomeScore(1),
                onMinus: () => state.changeHomeScore(-1),
                onTimeout: () => state.useTimeout(true),
                accentColor: const Color(0xFF64B5F6),
              )),
              Container(
                height: 80,
                width: 1,
                margin: const EdgeInsets.symmetric(horizontal: 4),
                color: Colors.white12,
              ),
              Expanded(child: _ScoreSide(
                label: 'AWAY',
                score: game.awayScore,
                timeouts: game.awayTimeouts,
                onPlus: () => state.changeAwayScore(1),
                onMinus: () => state.changeAwayScore(-1),
                onTimeout: () => state.useTimeout(false),
                accentColor: const Color(0xFFEF9A9A),
              )),
            ],
          ),
        ],
      ),
    );
  }
}

class _ScoreSide extends StatelessWidget {
  final String label;
  final int score;
  final int timeouts;
  final VoidCallback onPlus;
  final VoidCallback onMinus;
  final VoidCallback onTimeout;
  final Color accentColor;

  const _ScoreSide({
    required this.label,
    required this.score,
    required this.timeouts,
    required this.onPlus,
    required this.onMinus,
    required this.onTimeout,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(label, style: TextStyle(color: accentColor, fontSize: 12, fontWeight: FontWeight.w700, letterSpacing: 1.5)),
        const SizedBox(height: 8),
        Text(
          score.toString().padLeft(2, '0'),
          style: TextStyle(fontSize: 64, fontWeight: FontWeight.w900, color: Colors.white, height: 1,
            shadows: [Shadow(color: accentColor.withValues(alpha: 0.5), blurRadius: 16)],
          ),
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _ScoreBtn(icon: Icons.remove_rounded, onTap: onMinus, color: Colors.white24),
            const SizedBox(width: 8),
            _ScoreBtn(icon: Icons.add_rounded, onTap: onPlus, color: accentColor.withValues(alpha: 0.3)),
          ],
        ),
        const SizedBox(height: 10),
        GestureDetector(
          onTap: timeouts > 0 ? onTimeout : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
            decoration: BoxDecoration(
              color: timeouts > 0 ? Colors.white.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.04),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.white.withValues(alpha: timeouts > 0 ? 0.2 : 0.08)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.timer_outlined, size: 13, color: timeouts > 0 ? Colors.white70 : Colors.white30),
                const SizedBox(width: 4),
                Text(
                  'T/O  ${'●' * timeouts}${'○' * (2 - timeouts)}',
                  style: TextStyle(
                    color: timeouts > 0 ? Colors.white70 : Colors.white30,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _ScoreBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final Color color;
  const _ScoreBtn({required this.icon, required this.onTap, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}

class _RotationControls extends StatelessWidget {
  final AppState state;
  const _RotationControls({required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: AppTheme.cardDecoration(),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _RotateBtn(
              icon: Icons.rotate_left_rounded,
              label: 'Rotate Back',
              onTap: state.rotateBackward,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _RotateBtn(
              icon: Icons.rotate_right_rounded,
              label: 'Rotate Forward',
              onTap: state.rotateForward,
              filled: true,
            ),
          ),
        ],
      ),
    );
  }
}

class _RotateBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool filled;
  const _RotateBtn({required this.icon, required this.label, required this.onTap, this.filled = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: filled ? AppColors.green : AppColors.green.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
          border: filled ? null : Border.all(color: AppColors.green.withValues(alpha: 0.2)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: filled ? Colors.white : AppColors.green, size: 18),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(color: filled ? Colors.white : AppColors.green, fontWeight: FontWeight.w600, fontSize: 13)),
          ],
        ),
      ),
    );
  }
}

class _StatsTab extends StatelessWidget {
  final AppState state;
  const _StatsTab({required this.state});

  @override
  Widget build(BuildContext context) {
    final activePlayers = state.game.courtPlayers.isNotEmpty
        ? state.game.courtPlayers
        : state.players.take(6).toList();

    if (activePlayers.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('📊', style: TextStyle(fontSize: 48)),
            SizedBox(height: 12),
            Text('Start a game to track stats.', style: TextStyle(color: Colors.grey, fontSize: 15)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: activePlayers.length,
      itemBuilder: (context, i) {
        final livePlayer = state.players.firstWhere(
          (p) => p.id == activePlayers[i].id,
          orElse: () => activePlayers[i],
        );
        return _StatCard(player: livePlayer, state: state);
      },
    );
  }
}

class _StatCard extends StatelessWidget {
  final Player player;
  final AppState state;
  const _StatCard({required this.player, required this.state});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: AppTheme.cardDecoration(),
      padding: const EdgeInsets.all(14),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 20,
                backgroundColor: AppColors.green,
                child: Text('#${player.jerseyNumber}',
                  style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(player.name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                  Text(player.position, style: const TextStyle(color: Colors.grey, fontSize: 11)),
                ],
              ),
              const Spacer(),
              Text(
                '${player.stats.kills + player.stats.digs + player.stats.aces} pts',
                style: const TextStyle(color: AppColors.green, fontWeight: FontWeight.w700, fontSize: 13),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _StatTile(label: 'KILL', value: player.stats.kills, color: AppColors.outside,
                onTap: () => state.changeStat(player, 'kills', 1),
                onLong: () => state.changeStat(player, 'kills', -1)),
              _StatTile(label: 'DIG', value: player.stats.digs, color: AppColors.setter,
                onTap: () => state.changeStat(player, 'digs', 1),
                onLong: () => state.changeStat(player, 'digs', -1)),
              _StatTile(label: 'ACE', value: player.stats.aces, color: AppColors.middleBlocker,
                onTap: () => state.changeStat(player, 'aces', 1),
                onLong: () => state.changeStat(player, 'aces', -1)),
              _StatTile(label: 'ERR', value: player.stats.errors, color: AppColors.opposite,
                onTap: () => state.changeStat(player, 'errors', 1),
                onLong: () => state.changeStat(player, 'errors', -1)),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  final VoidCallback onTap;
  final VoidCallback onLong;

  const _StatTile({
    required this.label,
    required this.value,
    required this.color,
    required this.onTap,
    required this.onLong,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        onLongPress: onLong,
        child: Container(
          margin: const EdgeInsets.symmetric(horizontal: 4),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [color.withValues(alpha: 0.12), color.withValues(alpha: 0.06)],
            ),
            borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
            border: Border.all(color: color.withValues(alpha: 0.25)),
          ),
          child: Column(
            children: [
              Text('$value', style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: color, height: 1)),
              const SizedBox(height: 4),
              Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1)),
            ],
          ),
        ),
      ),
    );
  }
}
