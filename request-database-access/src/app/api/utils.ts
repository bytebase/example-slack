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

/* Fetch projects list */
export async function fetchProjectList() {
    try {
        const token = await generateBBToken();
        const res = await fetch(`${process.env.BB_HOST}/v1/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch projects: ${res.statusText}`);
        }

        const data = await res.json();
        console.log('data ===============', data);
        return data.projects?.map(project => ({
            id: project.name.split('/')[1],
            name: project.title
        })) || [];
    } catch (error) {
        console.error('Error fetching projects:', error);
        // Return dummy data for testing
        return [
            { id: 'project_a', name: 'Project A' },
            { id: 'project_b', name: 'Project B' },
            { id: 'project_c', name: 'Project C' }
        ];
    }
}

/* Fetch databases for a project */
export async function fetchDatabasesForProject(projectId: string) {
    try {
        const token = await generateBBToken();
        const res = await fetch(`${process.env.BB_HOST}/v1/projects/${projectId}/databases`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch databases: ${res.statusText}`);
        }

        const data = await res.json();

        console.log('fetchDatabasesForProject data ===============', data);

        return data.instances?.map(db => ({
            id: db.instanceId || db.id,
            name: db.title || db.name
        })) || [];
    } catch (error) {
        console.error('Error fetching databases:', error);
        // Return dummy data for testing
        const databases = {
            project_a: [
                { id: 'db1', name: 'Database 1' },
                { id: 'db2', name: 'Database 2' }
            ],
            project_b: [
                { id: 'db3', name: 'Database 3' },
                { id: 'db4', name: 'Database 4' }
            ],
            project_c: [
                { id: 'db5', name: 'Database 5' },
                { id: 'db6', name: 'Database 6' }
            ]
        };
        return databases[projectId] || [];
    }
}