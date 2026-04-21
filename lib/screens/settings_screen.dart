import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned: true,
            expandedHeight: 100,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF37474F), Color(0xFF546E7A), Color(0xFF607D8B)],
                  ),
                ),
                child: Align(
                  alignment: Alignment.bottomLeft,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 14),
                    child: const Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('⚙️', style: TextStyle(fontSize: 24)),
                        SizedBox(width: 10),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Settings', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                            Text('Preferences & options', style: TextStyle(color: Colors.white70, fontSize: 11)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              titlePadding: const EdgeInsets.only(left: 56, bottom: 14),
              title: const Text('Settings', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 17)),
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // Profile card
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [AppColors.greenDark, AppColors.green],
                    ),
                    borderRadius: BorderRadius.circular(AppTheme.radiusLarge),
                    boxShadow: [
                      BoxShadow(color: AppColors.green.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, 5)),
                    ],
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 56, height: 56,
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white.withValues(alpha: 0.3), width: 2),
                        ),
                        child: const Center(child: Text('👤', style: TextStyle(fontSize: 26))),
                      ),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(state.userName,
                            style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
                          const Text('Head Coach', style: TextStyle(color: Colors.white70, fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Data section
                const _SectionLabel('Data Management'),
                const SizedBox(height: 10),
                Container(
                  decoration: AppTheme.cardDecoration(),
                  child: Column(
                    children: [
                      _SettingRow(
                        icon: Icons.people_rounded,
                        iconColor: const Color(0xFF1565C0),
                        title: 'Players',
                        subtitle: '${state.players.length} in roster',
                      ),
                      _Divider(),
                      _SettingRow(
                        icon: Icons.grid_view_rounded,
                        iconColor: const Color(0xFF6A1B9A),
                        title: 'Lineups',
                        subtitle: '${state.lineups.length} saved',
                      ),
                      _Divider(),
                      _SettingRow(
                        icon: Icons.delete_sweep_rounded,
                        iconColor: Colors.redAccent,
                        title: 'Reset All Data',
                        subtitle: 'Restores sample data',
                        trailing: Icons.chevron_right,
                        onTap: () => _confirmReset(context, state),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // About section
                const _SectionLabel('About'),
                const SizedBox(height: 10),
                Container(
                  decoration: AppTheme.cardDecoration(),
                  child: Column(
                    children: [
                      _SettingRow(
                        icon: Icons.sports_volleyball_rounded,
                        iconColor: AppColors.orange,
                        title: 'Order in the Court',
                        subtitle: 'Volleyball Coaching Assistant v1.0',
                      ),
                      _Divider(),
                      _SettingRow(
                        icon: Icons.touch_app_rounded,
                        iconColor: AppColors.green,
                        title: 'Tip',
                        subtitle: 'Long-press stat buttons to subtract',
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 32),

                // Logout button
                GestureDetector(
                  onTap: () => _logout(context, state),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFFC62828), Color(0xFFE53935)],
                      ),
                      borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
                      boxShadow: [
                        BoxShadow(color: Colors.red.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4)),
                      ],
                    ),
                    child: const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.logout_rounded, color: Colors.white, size: 20),
                        SizedBox(width: 10),
                        Text('Sign Out', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmReset(BuildContext context, AppState state) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusLarge)),
        title: const Text('Reset App Data', style: TextStyle(fontWeight: FontWeight.w700)),
        content: const Text('This deletes all players, lineups, and game data, then reloads sample data. Continue?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reset'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await state.resetAllData();
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('App data has been reset.'), behavior: SnackBarBehavior.floating),
        );
      }
    }
  }

  Future<void> _logout(BuildContext context, AppState state) async {
    await state.logout();
    if (context.mounted) Navigator.of(context).popUntil((route) => route.isFirst);
  }
}

class _SectionLabel extends StatelessWidget {
  final String text;
  const _SectionLabel(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text.toUpperCase(),
      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.grey, letterSpacing: 1.2),
    );
  }
}

class _SettingRow extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String subtitle;
  final IconData? trailing;
  final VoidCallback? onTap;

  const _SettingRow({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    this.trailing,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppTheme.radius),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            Container(
              width: 38, height: 38,
              decoration: BoxDecoration(
                color: iconColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                  Text(subtitle, style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ],
              ),
            ),
            if (trailing != null) Icon(trailing, color: Colors.grey.shade400, size: 18),
          ],
        ),
      ),
    );
  }
}

class _Divider extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Divider(height: 1, indent: 68, color: Colors.grey.shade100);
  }
}
