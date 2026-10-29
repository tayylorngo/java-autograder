import java.util.Scanner;
public class ZombieEscape {
  public static String outcome(int speed, int stamina, boolean weapon) {
    if (weapon) {
      if (stamina >= 20) return "You swing and win!";
      else return "Too tired to swing. The zombie got you!";
    } else {
      if (speed >= 15 && stamina >= 10) return "You outrun the zombie!";
      else return "The zombie got you!";
    }
  }
  public static void main(String[] a) {
    Scanner in = new Scanner(System.in);
    System.out.print("Name: "); String name = in.next();
    System.out.print("Speed: "); int sp = in.nextInt();
    System.out.print("Stamina: "); int st = in.nextInt();
    System.out.print("Has a weapon (true/false): "); boolean w = in.nextBoolean();
    System.out.println(name + " faces a zombie!");
    System.out.println(outcome(sp, st, w));
  }
}
