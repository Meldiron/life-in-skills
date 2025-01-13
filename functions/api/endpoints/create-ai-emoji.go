package endpoints

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

type UpdateSchedulerIntervalBody struct {
	SkillName string `json:"skillName"`
}

func CreateAiEmoji(Context openruntimes.Context) openruntimes.Response {
	var body UpdateSchedulerIntervalBody
	err := Context.Req.BodyJson(&body)
	if err != nil {
		return Context.Res.Text("Invalid body.", Context.Res.WithStatusCode(400))
	}

	if body.SkillName == "" {
		return Context.Res.Text("Skill name is required.", Context.Res.WithStatusCode(400))
	}

	// Ensure it's user-executed
	userId, userIdOk := Context.Req.Headers["x-appwrite-user-id"]
	if !userIdOk || userId == "" {
		return Context.Res.Text("Unauthorized", Context.Res.WithStatusCode(401))
	}

	type OpenAIBodyMessage struct {
		Role    string `json:"role"`
		Content string `json:"content"`
	}

	type OpenAIBody struct {
		Model    string              `json:"model"`
		Messages []OpenAIBodyMessage `json:"messages"`
	}

	requestBody := OpenAIBody{
		Model: "gpt-4o-mini",
		Messages: []OpenAIBodyMessage{
			OpenAIBodyMessage{
				Role:    "developer",
				Content: "User will provide a habit, skill, or in general their goal, activity, achievement, or resolution. Respond with only one symbol which is emoji that best represents user's input.",
			},
			OpenAIBodyMessage{
				Role:    "user",
				Content: body.SkillName,
			},
		},
	}

	jsonData, err := json.Marshal(requestBody)
	if err != nil {
		Context.Error("Internal error, cannot prepare OpenAI request.")
		Context.Error(err)
		return Context.Res.Text("Internal error.", Context.Res.WithStatusCode(500))
	}

	req, err := http.NewRequest("POST", "https://api.openai.com/v1/chat/completions", bytes.NewBuffer(jsonData))
	if err != nil {
		Context.Error("Internal error, problem preparing Open AI request.")
		Context.Error(err)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	apiKey := os.Getenv("OPENAI_API_KEY")

	if apiKey == "" {
		Context.Error("Internal error, API key env var not setup correctly.")
		Context.Error(err)
		return Context.Res.Text("Internal error.", Context.Res.WithStatusCode(500))
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		Context.Error("Internal error, problematic response from Open AI.")
		Context.Error(err)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		Context.Error("Internal error, Open AI gave non 2xx status code.")
		Context.Error(resp.StatusCode)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		Context.Error("Internal error, cannot parse OpenAI body.")
		Context.Error(resp.StatusCode)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	type OpenAIResponseChoice struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	}

	type OpenAIResponse struct {
		Choices []OpenAIResponseChoice `json:"choices"`
	}

	var respBodyParsed OpenAIResponse
	err = json.Unmarshal(respBody, &respBodyParsed)
	if err != nil {
		Context.Error("Internal error, cannot struct OpenAI body.")
		Context.Error(resp.StatusCode)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	if len(respBodyParsed.Choices) == 0 {
		Context.Error("Internal error, OpenAI gave no response.")
		Context.Error(resp.StatusCode)
		return Context.Res.Text("AI generation failed.", Context.Res.WithStatusCode(500))
	}

	emoji := respBodyParsed.Choices[0].Message.Content

	return Context.Res.Text(emoji, Context.Res.WithStatusCode(200))
}
