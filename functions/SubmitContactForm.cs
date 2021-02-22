using System;
using System.IO;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using SendGrid.Helpers.Mail;
using System.Text;
using System.Net.Http;
using Microsoft.AspNetCore.WebUtilities;
using System.Collections.Generic;

namespace DanielCoats.Functions
{
    public static class SubmitContactForm
    {
        private static HttpClient httpClient = new HttpClient();

        [FunctionName("SubmitContactForm")]
        public static async Task<IActionResult> Run(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post", Route = null)] HttpRequest req,
            [SendGrid] IAsyncCollector<SendGridMessage> messageCollector,
            ILogger log)
        {
            log.LogInformation("Contact form received a request");

            string requestBody = String.Empty;
            using (StreamReader streamReader = new StreamReader(req.Body))
            {
                requestBody = await streamReader.ReadToEndAsync();
            }

            Submission data;
            try
            {
                data = JsonConvert.DeserializeObject<Submission>(requestBody);
            }
            catch
            {
                return new BadRequestObjectResult(new ErrorResponse("Bad Request", "Invalid payload"));
            }

            if (string.IsNullOrEmpty(data.EmailAddress)
                || string.IsNullOrEmpty(data.Message)
                || string.IsNullOrEmpty(data.RecaptchaToken))
            {
                return new BadRequestObjectResult(new ErrorResponse("Bad Request", "Missing a field"));
            }

            try
            {
                await ValidateRecaptcha(httpClient, data.RecaptchaToken);
            }
            catch
            {
                return new StatusCodeResult(StatusCodes.Status500InternalServerError);
            }

            await messageCollector.AddAsync(BuildMessage(data));

            log.LogInformation("Contact form successfully processed the request");

            return new OkObjectResult($"Email successfully sent");
        }

        private async static Task ValidateRecaptcha(HttpClient client, string recaptchaToken)
        {
            var queryParams = new Dictionary<string, string>()
            {
                { "secret", Environment.GetEnvironmentVariable("RecaptchaSecret") },
                { "response", recaptchaToken }
            };

            var requestUri = QueryHelpers.AddQueryString("https://www.google.com/recaptcha/api/siteverify", queryParams);

            using (var request = new HttpRequestMessage(HttpMethod.Post, requestUri))
            {
                using (var response = await httpClient.SendAsync(request))
                {
                    response.EnsureSuccessStatusCode();
                    var responseJson = await response.Content.ReadAsStringAsync();
                    var recaptchaResponse = JsonConvert.DeserializeObject<RecaptchaResponse>(responseJson);

                    if (!recaptchaResponse.Success)
                    {
                        throw new ArgumentException("Invalid recaptcha code");
                    }
                }
            }
        }

        private static SendGridMessage BuildMessage(Submission data)
        {
            var message = new SendGridMessage()
            {
                From = new EmailAddress("noreply@danielcoats.nz", "Daniel Coats"),
            };

            message.SetSubject("New Contact Form Submission");

            var sb = new StringBuilder();
            sb.Append($"You have received a new message:<br/><br/>");
            sb.Append($"<strong>Email address:</strong> {data.EmailAddress}<br/>");
            sb.Append($"<strong>Message:</strong> {data.Message}");

            message.AddContent("text/html", sb.ToString());
            message.AddTo("daniel.coats@outlook.com");

            return message;
        }
    }

    internal class Submission
    {
        public string EmailAddress { get; set; }

        public string Message { get; set; }

        public string RecaptchaToken { get; set; }
    }

    internal class RecaptchaResponse
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("challenge_ts")]
        public string ChallengeTimestamp { get; set; }

        [JsonProperty("hostname")]
        public string Hostname { get; set; }
    }

    internal class ErrorResponse
    {
        public ErrorResponse(string code, string message)
        {
            Error = new ErrorDetails
            {
                Code = code,
                Message = message
            };
        }

        [JsonProperty("error")]
        public ErrorDetails Error { get; set; }
    }

    internal class ErrorDetails
    {
        [JsonProperty("code")]
        public string Code { get; set; }

        [JsonProperty("message")]
        public string Message { get; set; }
    }
}
