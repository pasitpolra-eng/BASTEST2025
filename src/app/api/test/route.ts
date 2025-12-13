export async function POST(req: Request) {
  const body = await req.json();

  return Response.json({
    ok: true,
    you_sent: body,
    message: "ทำงานจาก /api/test สำเร็จ!",
  });
}
