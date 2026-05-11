(async () => {
    try {
        const res = await fetch('http://localhost:3000/api/admin/config', {
            method: 'POST',
            body: JSON.stringify({
                klingKey: "a.b",
                klingMode: "task",
                klingBaseUrl: "https://api-beijing.klingai.com/v1"
            }),
            headers: {
                "Authorization": "Bearer liangshan",
                "Content-Type": "application/json"
            }
        });
        const res2 = await fetch('http://localhost:3000/api/v1/generate', {
            method: 'POST',
            body: JSON.stringify({
                model: "kling-v3",
                prompt: "A beautiful sunset"
            }),
            headers: {
                "Authorization": "Bearer liangshan",
                "Content-Type": "application/json"
            }
        });
        const data = await res2.json();
        console.log(data);
    } catch(e) {
        console.log(e.message);
    }
})();
