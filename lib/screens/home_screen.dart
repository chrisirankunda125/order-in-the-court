import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../app_theme.dart';
import 'roster_screen.dart';
import 'lineup_builder_screen.dart';
import 'game_screen.dart';
import 'settings_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 160,
            pinned: true,
            backgroundColor: AppColors.green,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.greenDark, AppColors.green, Color(0xFF43A047)],
                  ),
                ),
                child: SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hello, ${state.userName} 👋',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 4),
                              const Text(
                                'Order in the Court',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 26,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 0.3,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  _StatPill(Icons.people, '${state.players.length} players'),
                                  const SizedBox(width: 8),
                                  _StatPill(Icons.grid_view, '${state.lineups.length} lineups'),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const Text('🏐', style: TextStyle(fontSize: 52)),
                      ],
                    ),
                  ),
                ),
              ),
              title: const Text(
                'Order in the Court',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17),
              ),
              titlePadding: const EdgeInsets.only(left: 20, bottom: 14),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: SliverGrid(
              delegate: SliverChildListDelegate([
                _DashCard(
                  emoji: '👥',
                  label: 'Roster',
                  subtitle: '${state.players.length} players',
                  gradientColors: const [Color(0xFF1565C0), Color(0xFF1976D2)],
                  onTap: () => Navigator.push(context, _route(const RosterScreen())),
                ),
                _DashCard(
                  emoji: '📋',
                  label: 'Lineups',
                  subtitle: '${state.lineups.length} saved',
                  gradientColors: const [Color(0xFF6A1B9A), Color(0xFF8E24AA)],
                  onTap: () => Navigator.push(context, _route(const LineupBuilderScreen())),
                ),
                _DashCard(
                  emoji: '🏐',
                  label: 'Game',
                  subtitle: 'Live tracking',
                  gradientColors: const [Color(0xFFE64A19), Color(0xFFFF6B35)],
                  onTap: () => Navigator.push(context, _route(const GameScreen())),
                ),
                _DashCard(
                  emoji: '⚙️',
                  label: 'Settings',
                  subtitle: 'App options',
                  gradientColors: const [Color(0xFF37474F), Color(0xFF546E7A)],
                  onTap: () => Navigator.push(context, _route(const SettingsScreen())),
                ),
              ]),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 1.0,
              ),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
            sliver: SliverToBoxAdapter(
              child: _QuickTip(),
            ),
          ),
        ],
      ),
    );
  }

  PageRoute _route(Widget page) => MaterialPageRoute(builder: (_) => page);
}

class _StatPill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _StatPill(this.icon, this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.white70),
          const SizedBox(width: 5),
          Text(label, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _DashCard extends StatelessWidget {
  final String emoji;
  final String label;
  final String subtitle;
  final List<Color> gradientColors;
  final VoidCallback onTap;

  const _DashCard({
    required this.emoji,
    required this.label,
    required this.subtitle,
    required this.gradientColors,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: AppTheme.gradientCard(gradientColors),
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.18),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(child: Text(emoji, style: const TextStyle(fontSize: 22))),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w800, color: Colors.white)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.white60, fontSize: 12)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickTip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.orange.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(AppTheme.radius),
        border: Border.all(color: AppColors.orange.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.orange.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: const Center(child: Text('💡', style: TextStyle(fontSize: 18))),
          ),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Tip: Long-press stat buttons to subtract. Use "End Set" to reset scores and rotations.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ),
        ],
      ),
    );
  }
}
