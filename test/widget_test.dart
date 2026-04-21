import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:order_in_the_court/main.dart';
import 'package:order_in_the_court/app_state.dart';

void main() {
  testWidgets('App launches and shows login screen', (WidgetTester tester) async {
    await tester.pumpWidget(
      ChangeNotifierProvider(
        create: (_) => AppState(),
        child: const OrderInTheCourtApp(),
      ),
    );
    expect(find.text('Order in the Court'), findsOneWidget);
  });
}
