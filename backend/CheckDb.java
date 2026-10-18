import java.sql.*;
public class CheckDb {
    public static void main(String[] args) throws Exception {
        try (Connection c = DriverManager.getConnection("jdbc:postgresql://localhost:5432/cloudguard_db", "postgres", "postgres");
             Statement s = c.createStatement();
             ResultSet rs = s.executeQuery("SELECT count(*) FROM users")) {
            rs.next();
            System.out.println("USER COUNT: " + rs.getInt(1));
        }
    }
}
