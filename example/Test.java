public class Test {
    public int plus(int a, int b) {
    	int c = a + b;
    	return c;
    }

    public static void main(String[] args) {
    	Test test = new Test();
    	int c = test.plus(1, 2);
    	System.out.println(c);
        System.out.println("Hello world");
    }
}
