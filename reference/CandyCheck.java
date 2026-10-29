import java.util.Scanner;
public class CandyCheck {
  public static String rating(int pieces) {
    if (pieces >= 50) return "Legendary haul!";
    else if (pieces >= 25) return "Solid haul.";
    else if (pieces >= 10) return "Not bad.";
    else return "The neighbors ghosted you.";
  }
  public static void main(String[] a) {
    Scanner in = new Scanner(System.in);
    System.out.print("Name: "); String name = in.next();
    System.out.print("Pieces of candy: "); int n = in.nextInt();
    System.out.println(name + " collected " + n + " pieces: " + rating(n));
  }
}
