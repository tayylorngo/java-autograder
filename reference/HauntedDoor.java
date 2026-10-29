import java.util.Scanner;
public class HauntedDoor {
  public static boolean canEnter(int age, boolean withAdult, boolean scared) {
    return (age >= 12 || withAdult) && !scared;
  }
  public static void main(String[] a) {
    Scanner in = new Scanner(System.in);
    System.out.print("Name: "); String name = in.next();
    System.out.print("Age: "); int age = in.nextInt();
    System.out.print("With an adult (true/false): "); boolean adult = in.nextBoolean();
    System.out.print("Scared (true/false): "); boolean scared = in.nextBoolean();
    if (canEnter(age, adult, scared)) System.out.println(name + ", the door creaks open...");
    else System.out.println(name + ", the ghost blocks your way.");
  }
}
