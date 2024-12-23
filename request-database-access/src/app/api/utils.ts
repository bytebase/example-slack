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
        console.log('Fetching projects...');
        const token = await generateBBToken();
        console.log('Got BB token:', token ? 'Token received' : 'No token');

        const url = `${process.env.BB_HOST}/v1/projects`;
        console.log('Fetching from URL:', url);

        const res = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            cache: 'no-store'
        });

        console.log('Response status:', res.status);
        
        if (!res.ok) {
            const errorText = await res.text();
            console.error('Error response:', errorText);
            throw new Error(`Failed to fetch projects: ${res.statusText}. Response: ${errorText}`);
        }

        const data = await res.json();
        console.log('Projects data:', JSON.stringify(data, null, 2));

        const projects = data.projects?.map(project => ({
            id: project.projectId || project.name.split('/')[1],
            name: project.title || project.name
        })) || [];

        console.log('Processed projects:', JSON.stringify(projects, null, 2));
        return projects;
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

type DatabaseList = { id: string; name: string; }[];
type DatabaseMap = { [key: string]: DatabaseList };

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

        return data.databases?.map(db => ({
            id: db.name,
            name: db.name
        })) || [];
    } catch (error) {
        console.error('Error fetching databases:', error);
        // Return dummy data for testing
        const databases: DatabaseMap = {
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