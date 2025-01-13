package handler

import (
	"openruntimes/handler/endpoints"

	"github.com/open-runtimes/types-for-go/v4/openruntimes"
)

func Main(Context openruntimes.Context) openruntimes.Response {
	action := Context.Req.Method + " " + Context.Req.Path
	switch a := action; a {
	case "POST /v1/ai/emoji":
		return endpoints.CreateAiEmoji(Context)
	default:
		return Context.Res.Text("Not Found", Context.Res.WithStatusCode(404))
	}
}
