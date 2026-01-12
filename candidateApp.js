const mysql = require("mysql2");
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "vansh070704",
    database: "interview_eval"
});

db.connect(err => {
    if (err) {
        console.log("DB connection failed");
        process.exit();
    }
    console.log("Connected to DB");
});

const ask = q => new Promise(r => rl.question(q, r));

(async () => {
    try {
        const studentName = await ask("Student Name: ");
        const collegeName = await ask("College Name: ");
        const r1 = parseFloat(await ask("Round1 marks (0-10): "));
        const r2 = parseFloat(await ask("Round2 marks (0-10): "));
        const r3 = parseFloat(await ask("Round3 marks (0-10): "));
        const tech = parseFloat(await ask("Technical Round marks (0-20): "));

        if (studentName.length > 30 || collegeName.length > 50) {
            console.log("Name length exceeded");
            return;
        }

        if ([r1, r2, r3].some(v => isNaN(v) || v < 0 || v > 10) || isNaN(tech) || tech < 0 || tech > 20) {
            console.log("Invalid marks");
            return;
        }

        const total = r1 + r2 + r3 + tech;
        const status = total >= 35 ? "Selected" : "Rejected";

        await db.promise().execute(
            `INSERT INTO candidate_scores
            (student_name, college_name, round1_marks, round2_marks, round3_marks,
             technical_round_marks, total_marks, result_status)
             VALUES (?,?,?,?,?,?,?,?)`,
            [studentName, collegeName, r1, r2, r3, tech, total, status]
        );

        await db.promise().query(`
            UPDATE candidate_scores c
            JOIN (
                SELECT id,
                       ROW_NUMBER() OVER (ORDER BY total_marks DESC) AS rnk
                FROM candidate_scores
            ) t ON c.id = t.id
            SET c.candidate_rank = t.rnk
        `);

        const [rows] = await db.promise().query(
            "SELECT * FROM candidate_scores ORDER BY candidate_rank"
        );

        console.log("\n--- Final Result ---");
        console.log("Name | College | Total | Result | Rank");

        rows.forEach(r => {
            console.log(
                `${r.student_name} | ${r.college_name} | ${r.total_marks} | ${r.result_status} | ${r.candidate_rank}`
            );
        });

    } catch (e) {
        console.log("Error:", e.message);
    } finally {
        rl.close();
        db.end();
    }
})();
