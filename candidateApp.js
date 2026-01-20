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
    // console.log("Connected to DB");
});

async function askValidNumber(label, min, max ) {
            let value ;
            while(true){
                value = parseFloat(await ask(`${label} (${min} - ${max}): `));
                if(!isNaN(value) && value >= min && value <= max){
                    return value;
                }
                console.log(`invalid ${label}. Please enter again`);
            }
            
        }

const ask = q => new Promise(r => rl.question(q, r));


(async () => {
    try {

        let studentName;
        while(true){
            studentName = await ask("Student Name : ");
            if(studentName.length >= 1 && studentName.length <= 30) break;
            console.log("Student name must be 1 to 30 char");
        }

        let collegeName ;
          while(true){
            collegeName = await ask("College Name : ");
            if(collegeName.length >= 1 && collegeName.length <= 30) break;
            console.log("college name must be 1 to 30 char");
        }

        const r1 = await askValidNumber("round 1", 0,10);
        const r2 = await askValidNumber("round 2", 0,10);
        const r3 = await askValidNumber("round 3", 0,10);
        const tech = await askValidNumber("tech round", 0,20);

        const roundStatus = r1>=6.5 && r2 >= 6.5 && r3 >= 6.5 && tech >= 13 ;

        const total = r1+r2+r3+tech;

        const status = roundStatus && total >= 35 ? "Selected" : "Rejected"
    


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
