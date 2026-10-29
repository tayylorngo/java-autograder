import java.util.Scanner;
public class CursedWord {
  public static boolean isCursed(String word) {
    return word.indexOf("z") >= 0 || (word.length() >= 8 && word.indexOf("o") >= 0);
  }
  public static void main(String[] a) {
    Scanner in = new Scanner(System.in);
    System.out.print("Enter a word: "); String w = in.next();
    System.out.println("Length: " + w.length());
    if (isCursed(w)) System.out.println(w + " is CURSED!");
    else System.out.println(w + " is safe.");
  }
}
