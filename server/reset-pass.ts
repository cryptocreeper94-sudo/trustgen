import pg from 'pg'
import bcrypt from 'bcryptjs'

const { Pool } = pg

const pool = new Pool({
    connectionString: 'postgresql://localhost:5432/trustgen'
})

async function run() {
    console.log('Resetting passwords...')
    const hash = await bcrypt.hash('Temp12345!', 12)
    const emails = ['david_2071@yahoo.com', 'coopertue@gmail.com']
    for (const email of emails) {
        const res = await pool.query(
            'UPDATE users SET password_hash = $1, must_change_password = true WHERE email = $2 RETURNING id',
            [hash, email]
        )
        if (res.rowCount && res.rowCount > 0) {
            console.log(`Reset successful for ${email}`)
        } else {
            console.log(`User ${email} not found`)
        }
    }
    await pool.end()
    console.log('Done.')
}
run().catch(console.error)
