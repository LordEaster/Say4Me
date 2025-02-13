export async function uploadToCloudflare(file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(process.env.CLOUDFLARE_R2_URL!, {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_R2_API_KEY}` },
        body: formData,
    });

    if (!response.ok) throw new Error("Cloudflare upload failed");

    const data = await response.json();
    return data.url; // URL of the uploaded file
}