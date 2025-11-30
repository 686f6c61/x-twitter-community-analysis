import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"

export function AIAnalysisPage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Análisis con IA</CardTitle>
          <CardDescription>
            Genera análisis inteligentes usando modelos de lenguaje
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configura tu API Key de OpenRouter para empezar
            </p>
            <Button disabled>Generar Análisis</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
