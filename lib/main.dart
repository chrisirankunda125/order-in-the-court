import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app_state.dart';
import 'app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AppState(),
      child: const OrderInTheCourtApp(),
    ),
  );
}

class OrderInTheCourtApp extends StatelessWidget {
  const OrderInTheCourtApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Order in the Court',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.theme,
      home: const _AppRoot(),
    );
  }
}

class _AppRoot extends StatelessWidget {
  const _AppRoot();

  @override
  Widget build(BuildContext context) {
    final isLoggedIn = context.watch<AppState>().isLoggedIn;
    return isLoggedIn ? const HomeScreen() : const LoginScreen();
  }
}
