const PORT = 69;


// All this scrypt does is serve the fruity_loops.html file
const handler = async (request: Request): Promise<Response> => {
  try {
    // Open the HTML file
    const file = await Deno.open("client/fruity_loops.html", { read: true });
    // Create a Response object with the file's content
    return new Response(file.readable, {
      headers: { "Content-Type": "text/html" },
    });
  } catch (error) {
    // Handle errors (e.g., file not found)
    return new Response("404 Not Found", { status: 404 });
  }
};

// Start the server
console.log(`HTTP web server running. Access it at: http://localhost:${PORT}/`);
Deno.serve(handler, { port: PORT });