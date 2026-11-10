package main

import "syscall/js"

func main() {
	gray := js.FuncOf(func(_ js.Value, args []js.Value) any {
		input := args[0]
		pixels := make([]byte, input.Get("length").Int())
		js.CopyBytesToGo(pixels, input)
		for index := 0; index+3 < len(pixels); index += 4 {
			light := byte((299*uint32(pixels[index]) + 587*uint32(pixels[index+1]) + 114*uint32(pixels[index+2]) + 500) / 1000)
			pixels[index], pixels[index+1], pixels[index+2] = light, light, light
		}
		output := js.Global().Get("Uint8Array").New(len(pixels))
		js.CopyBytesToJS(output, pixels)
		return output
	})
	js.Global().Set("photoGray", gray)
	select {}
}
