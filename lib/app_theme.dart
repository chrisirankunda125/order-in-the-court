import 'package:flutter/material.dart';

class AppColors {
  static const green = Color(0xFF2E7D32);
  static const greenDark = Color(0xFF1B5E20);
  static const greenLight = Color(0xFF43A047);
  static const orange = Color(0xFFFF6B35);
  static const orangeLight = Color(0xFFFF8C5A);
  static const surface = Color(0xFFF8F9FA);
  static const card = Colors.white;

  static const setter = Color(0xFF1565C0);
  static const middleBlocker = Color(0xFF7B1FA2);
  static const outside = Color(0xFF2E7D32);
  static const libero = Color(0xFFE65100);
  static const opposite = Color(0xFFC62828);

  static const scoreBlue = Color(0xFF0D47A1);
  static const scoreRed = Color(0xFFB71C1C);
}

class AppTheme {
  static const radius = 16.0;
  static const radiusSmall = 10.0;
  static const radiusLarge = 24.0;

  static BoxDecoration cardDecoration({double elevation = 1, Color? color}) {
    return BoxDecoration(
      color: color ?? AppColors.card,
      borderRadius: BorderRadius.circular(radius),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.06),
          blurRadius: elevation * 8,
          offset: Offset(0, elevation * 2),
        ),
      ],
    );
  }

  static BoxDecoration gradientCard(List<Color> colors) {
    return BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: colors,
      ),
      borderRadius: BorderRadius.circular(radiusLarge),
      boxShadow: [
        BoxShadow(
          color: colors.first.withValues(alpha: 0.35),
          blurRadius: 12,
          offset: const Offset(0, 6),
        ),
      ],
    );
  }

  static InputDecoration inputDecoration(String label, {IconData? icon}) {
    return InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon, color: AppColors.green) : null,
      filled: true,
      fillColor: const Color(0xFFF1F8E9),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSmall),
        borderSide: BorderSide.none,
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSmall),
        borderSide: const BorderSide(color: Color(0xFFDCEDC8), width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(radiusSmall),
        borderSide: const BorderSide(color: AppColors.green, width: 2),
      ),
      labelStyle: const TextStyle(color: Colors.grey),
    );
  }

  static ThemeData get theme => ThemeData(
    colorScheme: ColorScheme.fromSeed(
      seedColor: AppColors.green,
      primary: AppColors.green,
      secondary: AppColors.orange,
      surface: AppColors.surface,
    ),
    useMaterial3: true,
    scaffoldBackgroundColor: AppColors.surface,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.green,
      foregroundColor: Colors.white,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w700,
        color: Colors.white,
        letterSpacing: 0.3,
      ),
    ),
    cardTheme: CardThemeData(
      elevation: 0,
      color: AppColors.card,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radius)),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.orange,
        foregroundColor: Colors.white,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(radiusSmall)),
        textStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15),
      ),
    ),
    tabBarTheme: const TabBarThemeData(
      indicatorColor: AppColors.orange,
      labelColor: Colors.white,
      unselectedLabelColor: Colors.white60,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: TextStyle(fontWeight: FontWeight.w600),
    ),
  );
}
