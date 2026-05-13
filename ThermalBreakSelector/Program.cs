using System.Globalization;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

// Production: serve from the exe's directory (single-file apps extract to a temp dir,
// but wwwroot and the static-assets manifest live next to the exe)
if (!builder.Environment.IsDevelopment())
{
    var exeDir = Path.GetDirectoryName(Environment.ProcessPath) ?? AppContext.BaseDirectory;
    builder.Host.UseContentRoot(exeDir);
    builder.WebHost.UseUrls("http://localhost:5100");
}

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
else
{
    app.UseExceptionHandler("/Error");
}

app.UseRouting();
app.UseAuthorization();
app.MapStaticAssets();
app.MapRazorPages().WithStaticAssets();

// Redirect bare root to the named entry point
app.MapGet("/", ctx =>
{
    ctx.Response.Redirect("/ThermalBreakSelector.html", permanent: false);
    return Task.CompletedTask;
});

app.MapGet("/api/database", (IWebHostEnvironment env) =>
{
    const string csvName = "2026_05_11 ConnectorDatabase.csv";
    // Production: CSV lives next to the exe; Development: BackgroundData sibling folder
    var exeDir = Path.GetDirectoryName(Environment.ProcessPath) ?? AppContext.BaseDirectory;
    var csvPath = Path.Combine(exeDir, csvName);
    if (!File.Exists(csvPath))
        csvPath = Path.Combine(env.ContentRootPath, "..", "BackgroundData", csvName);
    if (!File.Exists(csvPath))
        return Results.NotFound("Database file not found");

    var rows = new List<Dictionary<string, object?>>();
    string[]? headers = null;

    foreach (var line in File.ReadLines(csvPath))
    {
        var cols = line.Split(';');
        if (headers == null)
        {
            headers = cols;
            continue;
        }
        var row = new Dictionary<string, object?>();
        for (int i = 0; i < headers.Length && i < cols.Length; i++)
        {
            var key = headers[i].Trim();
            if (string.IsNullOrEmpty(key)) continue;
            var raw = cols[i].Trim();
            row[key] = TryParseValue(raw);
        }
        rows.Add(row);
    }

    return Results.Json(rows, new JsonSerializerOptions { PropertyNamingPolicy = null });
});

app.Run();

static object? TryParseValue(string raw)
{
    if (string.IsNullOrEmpty(raw)) return null;
    if (raw.Equals("TRUE", StringComparison.OrdinalIgnoreCase)) return true;
    if (raw.Equals("FALSE", StringComparison.OrdinalIgnoreCase)) return false;
    if (double.TryParse(raw, NumberStyles.Float, CultureInfo.InvariantCulture, out var d)) return d;
    return raw;
}
