const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTests() {
  console.log("🚀 Starting System Integration Tests...");

  try {
    // 1. Test Database Connectivity
    console.log("\n--- 1. Database Connectivity ---");
    const userCount = await prisma.user.count();
    console.log(`✅ Connection successful. Total users in DB: ${userCount}`);

    // 2. Test User Creation (Database Level)
    console.log("\n--- 2. Database Write Operation ---");
    const testId = "test_user_" + Date.now();
    const testUser = await prisma.user.create({
      data: {
        id: testId,
        email: `test_${Date.now()}@example.com`,
        isSubscribed: false
      }
    });
    console.log(`✅ Successfully created test user: ${testUser.id}`);

    // 3. Test Todo Creation
    console.log("\n--- 3. Relation Management (Todos) ---");
    const testTodo = await prisma.todo.create({
      data: {
        title: "Verify Test Script",
        userId: testUser.id
      }
    });
    console.log(`✅ Successfully created todo for user: ${testTodo.title}`);

    // 4. Test Cleanup
    console.log("\n--- 4. Cleanup ---");
    await prisma.todo.delete({ where: { id: testTodo.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log("✅ Cleanup successful.");

    console.log("\n🌟 ALL TESTS PASSED SUCCESSFULLY! 🌟");

  } catch (error) {
    console.error("\n❌ Test Failed!");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
