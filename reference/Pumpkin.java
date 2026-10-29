import java.util.Scanner;
public class Pumpkin {
  public static String verdict(double lbs, boolean rotten) {
    if (lbs >= 10) {
      if (rotten) return "Compost it.";
      else if (lbs >= 50) return "Prize pumpkin!";
      else return "Great for carving.";
    } else return "Too small to carve.";
  }
  public static void main(String[] a) {
    Scanner in = new Scanner(System.in);
    System.out.print("Weight in pounds: "); double w = in.nextDouble();
    System.out.print("Rotten (true/false): "); boolean r = in.nextBoolean();
    System.out.println("Verdict: " + verdict(w, r));
  }
}
