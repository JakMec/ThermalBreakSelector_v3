using System.Globalization;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorPages();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseAuthorization();
app.MapStaticAssets();
app.MapRazorPages().WithStaticAssets();

app.MapGet("/api/database", (IWebHostEnvironment env) =>
{
    var csvPath = Path.Combine(env.ContentRootPath, "..", "BackgroundData", "2026_05_11 ConnectorDatabase.csv");
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
