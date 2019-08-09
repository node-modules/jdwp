public class Test {
    public static String name = "abc";
    public String id = "myId";

    public static int plus(int a, int b) {
    	int c = a + b;
    	return c;
    }

    public String sayHello(String name) {
        return "hello " + name;
    }

    public static void main(String[] args) {
    	int c = Test.plus(1, 2);
    	System.out.println(c);
        System.out.println(name);
    }
}
