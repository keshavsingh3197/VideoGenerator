namespace VideoGenerator.API.Extensions;

/// <summary>
/// Provides helpers for safe log output to prevent log injection attacks.
/// </summary>
public static class LogSanitizer
{
    /// <summary>
    /// Sanitizes a string for safe inclusion in log messages by removing
    /// newline characters, carriage returns, and other ASCII control characters
    /// that could be used to forge additional log entries.
    /// </summary>
    public static string Sanitize(string? value)
    {
        if (string.IsNullOrEmpty(value)) return string.Empty;

        return string.Concat(value.Where(c => !char.IsControl(c)));
    }
}
