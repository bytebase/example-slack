/* Generate token */ 
export async function generateBBToken() {

    const res = await fetch(`${process.env.BB_HOST}/v1/auth/login`, {
        method: "POST",
        body: JSON.stringify({
            "email": process.env.BB_SERVICE_ACCOUNT,
            "password": process.env.BB_SERVICE_KEY,
            "web": true
        }),
        headers: {
            'Content-Type': 'application/json',
            'Accept-Encoding': 'deflate, gzip',
        },
        cache: 'no-store'
    });

    const token = await res.json();
    return token.token;
}