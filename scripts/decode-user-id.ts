/**
 * Script để decode WordPress GraphQL User ID
 * 
 * WordPress GraphQL sử dụng Global ID format: base64("user:1076")
 * 
 * Usage:
 *   npx ts-node scripts/decode-user-id.ts dXNlcjoxMDc2
 */

const userId = process.argv[2];

if (!userId) {
  console.error("Usage: npx ts-node scripts/decode-user-id.ts <graphql_user_id>");
  console.error("Example: npx ts-node scripts/decode-user-id.ts dXNlcjoxMDc2");
  process.exit(1);
}

try {
  // Decode base64
  const decoded = Buffer.from(userId, "base64").toString("utf-8");
  
  // Format: "user:1076"
  const parts = decoded.split(":");
  
  if (parts.length === 2 && parts[0] === "user") {
    const wpUserId = parts[1];
    console.log("=".repeat(50));
    console.log("WordPress GraphQL User ID Decoder");
    console.log("=".repeat(50));
    console.log(`GraphQL ID: ${userId}`);
    console.log(`Decoded: ${decoded}`);
    console.log(`WordPress User ID: ${wpUserId}`);
    console.log("=".repeat(50));
    console.log("\nBạn có thể sử dụng WordPress User ID này để:");
    console.log(`1. Query user trong GraphQL: user(id: "${userId}")`);
    console.log(`2. Update user qua REST API: ${process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL || "https://cms.vitielts.com"}/wp-json/wp/v2/users/${wpUserId}`);
    console.log(`3. Xem user trong WordPress Admin: ${process.env.NEXT_PUBLIC_WORDPRESS_CMS_URL || "https://cms.vitielts.com"}/wp-admin/user-edit.php?user_id=${wpUserId}`);
  } else {
    console.error("Invalid format. Expected format: base64('user:ID')");
    console.log(`Decoded value: ${decoded}`);
  }
} catch (error) {
  console.error("Error decoding user ID:", error);
  console.error("Make sure the ID is a valid base64 encoded string");
}
