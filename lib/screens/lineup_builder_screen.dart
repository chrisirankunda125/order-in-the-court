import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../app_theme.dart';
import '../models/player.dart';
import '../models/lineup.dart';

class LineupBuilderScreen extends StatefulWidget {
  const LineupBuilderScreen({super.key});

  @override
  State<LineupBuilderScreen> createState() => _LineupBuilderScreenState();
}

class _LineupBuilderScreenState extends State<LineupBuilderScreen>
    with SingleTickerProviderStateMixin {
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
    return Scaffold(
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF6A1B9A), Color(0xFF8E24AA), Color(0xFFAB47BC)],
            ),
          ),
        ),
        title: const Row(
          children: [
            Text('📋', style: TextStyle(fontSize: 20)),
            SizedBox(width: 8),
            Text('Lineups', style: TextStyle(fontWeight: FontWeight.w700)),
          ],
        ),
        bottom: TabBar(
          controller: _tabs,
          tabs: const [
            Tab(text: 'Saved', icon: Icon(Icons.list_rounded, size: 18)),
            Tab(text: 'Build New', icon: Icon(Icons.add_circle_rounded, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: const [
          _SavedLineupsTab(),
          _BuildLineupTab(),
        ],
      ),
    );
  }
}

class _SavedLineupsTab extends StatelessWidget {
  const _SavedLineupsTab();

  @override
  Widget build(BuildContext context) {
    final lineups = context.watch<AppState>().lineups;

    if (lineups.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color: const Color(0xFF6A1B9A).withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: const Center(child: Text('📋', style: TextStyle(fontSize: 36))),
            ),
            const SizedBox(height: 16),
            const Text('No lineups yet', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            const Text('Switch to "Build New" to create one.', style: TextStyle(color: Colors.grey, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      itemCount: lineups.length,
      itemBuilder: (context, i) {
        final lineup = lineups[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: AppTheme.cardDecoration(),
          child: ExpansionTile(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radius)),
            collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radius)),
            leading: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6A1B9A), Color(0xFF8E24AA)]),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.grid_view_rounded, color: Colors.white, size: 18),
            ),
            title: Text(lineup.title, style: const TextStyle(fontWeight: FontWeight.w700)),
            subtitle: Text('${lineup.slots.length} players', style: const TextStyle(color: Colors.grey, fontSize: 12)),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                GestureDetector(
                  onTap: () => context.read<AppState>().deleteLineup(lineup.id),
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.delete_rounded, size: 16, color: Colors.redAccent),
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.expand_more),
              ],
            ),
            children: lineup.sortedSlots.map((slot) => Container(
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: const BorderRadius.only(
                  bottomLeft: Radius.circular(AppTheme.radius),
                  bottomRight: Radius.circular(AppTheme.radius),
                ),
              ),
              child: ListTile(
                dense: true,
                leading: Container(
                  width: 28, height: 28,
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    borderRadius: BorderRadius.circular(7),
                  ),
                  child: Center(
                    child: Text('${slot.courtPosition}',
                      style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                  ),
                ),
                title: Text(slot.player.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                subtitle: Text(slot.player.position, style: const TextStyle(fontSize: 11)),
                trailing: Text('#${slot.player.jerseyNumber}',
                  style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
              ),
            )).toList(),
          ),
        );
      },
    );
  }
}

class _BuildLineupTab extends StatefulWidget {
  const _BuildLineupTab();

  @override
  State<_BuildLineupTab> createState() => _BuildLineupTabState();
}

class _BuildLineupTabState extends State<_BuildLineupTab> {
  final _titleCtrl = TextEditingController(text: 'My Lineup');
  final Map<int, Player?> _assignments = {1: null, 2: null, 3: null, 4: null, 5: null, 6: null};

  @override
  void dispose() {
    _titleCtrl.dispose();
    super.dispose();
  }

  void _save() {
    final slots = <LineupSlot>[];
    for (final e in _assignments.entries) {
      if (e.value != null) slots.add(LineupSlot(player: e.value!, courtPosition: e.key));
    }
    if (slots.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Assign all 6 court positions first.'), behavior: SnackBarBehavior.floating),
      );
      return;
    }
    final title = _titleCtrl.text.trim().isEmpty ? 'My Lineup' : _titleCtrl.text.trim();
    context.read<AppState>().saveLineup(title, slots);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('"$title" saved!'), behavior: SnackBarBehavior.floating,
        backgroundColor: AppColors.green),
    );
    setState(() {
      for (int i = 1; i <= 6; i++) { _assignments[i] = null; }
      _titleCtrl.text = 'My Lineup';
    });
  }

  @override
  Widget build(BuildContext context) {
    final players = context.watch<AppState>().players;
    final assigned = _assignments.values.where((p) => p != null).length;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: _titleCtrl,
            decoration: AppTheme.inputDecoration('Lineup Name', icon: Icons.title),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Text('Court Assignment', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: assigned == 6 ? AppColors.green.withValues(alpha: 0.1) : Colors.grey.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '$assigned/6 filled',
                  style: TextStyle(
                    color: assigned == 6 ? AppColors.green : Colors.grey,
                    fontSize: 12, fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _CourtBuilder(assignments: _assignments, players: players, onChanged: (pos, p) {
            setState(() => _assignments[pos] = p);
          }),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _save,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.green,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppTheme.radiusSmall)),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.save_rounded, size: 20),
                  SizedBox(width: 8),
                  Text('Save Lineup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CourtBuilder extends StatelessWidget {
  final Map<int, Player?> assignments;
  final List<Player> players;
  final void Function(int, Player?) onChanged;

  const _CourtBuilder({required this.assignments, required this.players, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    Widget slot(int pos) => Expanded(child: _CourtSlot(
      position: pos,
      assigned: assignments[pos],
      players: players,
      onChanged: onChanged,
    ));

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
          // Net bar
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
                style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 8, fontWeight: FontWeight.w700, letterSpacing: 3),
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(children: [4, 3, 2].map(slot).toList()),
          const SizedBox(height: 4),
          Row(children: [5, 6, 1].map(slot).toList()),
        ],
      ),
    );
  }
}

class _CourtSlot extends StatelessWidget {
  final int position;
  final Player? assigned;
  final List<Player> players;
  final void Function(int, Player?) onChanged;

  const _CourtSlot({required this.position, required this.assigned, required this.players, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _pick(context),
      child: Container(
        margin: const EdgeInsets.all(5),
        height: 86,
        decoration: BoxDecoration(
          gradient: assigned != null
              ? const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFFF6B35), Color(0xFFFF8C5A)],
                )
              : null,
          color: assigned == null ? Colors.white.withValues(alpha: 0.12) : null,
          borderRadius: BorderRadius.circular(AppTheme.radiusSmall),
          border: Border.all(
            color: assigned != null ? Colors.transparent : Colors.white.withValues(alpha: 0.2),
          ),
          boxShadow: assigned != null
              ? [BoxShadow(color: AppColors.orange.withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 3))]
              : null,
        ),
        child: Stack(
          children: [
            if (assigned == null)
              Positioned(
                top: 6, right: 8,
                child: Text('$position', style: const TextStyle(color: Colors.white30, fontSize: 11, fontWeight: FontWeight.w700)),
              ),
            Center(
              child: assigned != null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 28, height: 28,
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.25),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text('#${assigned!.jerseyNumber}',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 10)),
                          ),
                        ),
                        const SizedBox(height: 5),
                        Text(
                          assigned!.name.split(' ').first,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11),
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text('P$position', style: const TextStyle(color: Colors.white60, fontSize: 9)),
                      ],
                    )
                  : const Icon(Icons.add_rounded, color: Colors.white38, size: 24),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pick(BuildContext context) async {
    final chosen = await showModalBottomSheet<Player?>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (_) => _PickerSheet(players: players, position: position),
    );
    if (chosen != null) {
      onChanged(position, chosen);
    }
  }
}

class _PickerSheet extends StatelessWidget {
  final List<Player> players;
  final int position;

  const _PickerSheet({required this.players, required this.position});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppTheme.radiusLarge)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            margin: const EdgeInsets.only(top: 10),
            width: 36, height: 4,
            decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    color: AppColors.orange,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: Text('$position',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 15)),
                  ),
                ),
                const SizedBox(width: 12),
                Text('Assign Position $position', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
              ],
            ),
          ),
          const Divider(height: 1),
          Flexible(
            child: ListView(
              shrinkWrap: true,
              children: [
                ListTile(
                  leading: Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.clear_rounded, color: Colors.redAccent, size: 18),
                  ),
                  title: const Text('Clear position', style: TextStyle(color: Colors.redAccent, fontWeight: FontWeight.w600)),
                  onTap: () => Navigator.pop(context, null),
                ),
                ...players.map((p) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: AppColors.green,
                    child: Text('#${p.jerseyNumber}', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w800)),
                  ),
                  title: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text(p.position, style: const TextStyle(fontSize: 11)),
                  onTap: () => Navigator.pop(context, p),
                )),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
