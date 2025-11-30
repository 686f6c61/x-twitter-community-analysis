/**
 * Análisis y procesamiento de texto
 */

/**
 * Extrae frecuencias de palabras de los tweets (sin stopwords)
 */
export function extractWordFrequencies(tweets: any[]): Array<{ word: string; count: number }> {
    console.log('[Worker] extractWordFrequencies recibió', tweets.length, 'tweets');
    if (tweets.length > 0) {
        const ejemplo = tweets[0];
        console.log('[Worker] Ejemplo completo de tweet:', ejemplo);
        console.log('[Worker] Campos disponibles:', Object.keys(ejemplo));

        // Intentar acceder a diferentes estructuras posibles
        if (ejemplo.tweet) {
            console.log('[Worker] ejemplo.tweet existe:', ejemplo.tweet);
            console.log('[Worker] ejemplo.tweet.text:', ejemplo.tweet.text);
            console.log('[Worker] ejemplo.tweet.full_text:', ejemplo.tweet.full_text);
        }
    }

    // Stopwords en español (palabras comunes a ignorar)
    const stopwords = new Set([
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
        'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
        'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
        'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
        'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
        'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
        'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
        'sí', 'día', 'uno', 'bien', 'poco', 'deber', 'entonces', 'poner', 'cosa',
        'tanto', 'hombre', 'parecer', 'nuestro', 'tan', 'donde', 'ahora', 'parte',
        'después', 'vida', 'quedar', 'siempre', 'creer', 'hablar', 'llevar', 'dejar',
        'nada', 'cada', 'seguir', 'menos', 'nuevo', 'encontrar', 'algo', 'solo',
        'decir', 'salir', 'volver', 'tomar', 'conocer', 'vivir', 'sentir', 'tratar',
        'mirar', 'contar', 'empezar', 'esperar', 'buscar', 'existir', 'entrar',
        'trabajar', 'escribir', 'perder', 'producir', 'ocurrir', 'entender', 'pedir',
        'recibir', 'recordar', 'terminar', 'permitir', 'aparecer', 'conseguir',
        'comenzar', 'servir', 'sacar', 'necesitar', 'mantener', 'resultar', 'leer',
        'caer', 'cambiar', 'presentar', 'crear', 'abrir', 'considerar', 'oír',
        'acabar', 'mil', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve',
        'diez', 'puede', 'sido', 'hay', 'era', 'fue', 'están', 'tiene', 'hace',
        'son', 'está', 'han', 'sea', 'sus', 'les', 'una', 'del', 'los', 'las',
        'al', 'ante', 'bajo', 'cabe', 'contra', 'durante', 'mediante', 'según',
        'sin', 'so', 'sobre', 'tras', 'versus', 'vía', 'es', 'eres', 'somos',
        'sois', 'he', 'has', 'hemos', 'habéis', 'tengo', 'tienes', 'tenemos',
        'tenéis', 'voy', 'vas', 'vamos', 'vais', 'van', 'rt', 'vía', 'https',
        'http', 'www', 'com', 'twitter', 'tweet'
    ]);

    const wordCount: Record<string, number> = {};

    tweets.forEach(item => {
        const tweet = item.tweet;
        if (!tweet || (!tweet.full_text && !tweet.text)) return;

        let text = tweet.full_text || tweet.text || '';

        // Limpiar texto
        text = text.toLowerCase();
        // Quitar URLs
        text = text.replace(/https?:\/\/[^\s]+/gi, '');
        // Quitar menciones
        text = text.replace(/@\w+/g, '');
        // Quitar símbolos # de hashtags pero mantener la palabra
        text = text.replace(/#/g, '');
        // Quitar puntuación
        text = text.replace(/[.,;:!?¿¡"'()[\]{}]/g, ' ');
        // Quitar números sueltos
        text = text.replace(/\b\d+\b/g, '');

        // Tokenizar
        const words = text.split(/\s+/).filter(w => w.length >= 3);

        // Contar palabras (excluyendo stopwords)
        words.forEach(word => {
            if (!stopwords.has(word)) {
                wordCount[word] = (wordCount[word] || 0) + 1;
            }
        });
    });

    // Convertir a array y ordenar por frecuencia
    const frequencies = Object.entries(wordCount)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 50); // Top 50 palabras

    return frequencies;
}
