# Es geht fast - nächtliche Notizen
 * zips werden geladen und geparst, die _notes sehen eigentlich gut aus
 * der track spielt
 * aber keine nots zu sehen, wenn aus zip geladen
 * zwischendurch gingen eingebaute maps auch nicht mehr, offenbar, da version auf "" gesetzt wurde. Hab das nun an zwei stellen auskommentiert, das hilft. Aber warum trat das erst neuerdings auf?
 * oft fehlen die blöcke vielleicht auch, weil ich im relax-modus bin, ohne es zu merken

 * bei nachgeladenen songs das gleiche, nur das "geht" eben ohne noten ist
 * nachgeladene songs machen dauerhaft was kaputt:
   * nachgeladenen song spielen -> keine noten
   * dann eingebauten song spielen -> auch keine noten

# Noch relevant:
 * ich hab das ganze messaging-System noch nicht wirklich verstanden. Nicht sicher, ob diese Beobachtungen stimmen:
   * messages gehen über Browser-native events, und können vielleicht auch objekte enthalten?
   * diese eigenschaften von components können nur strings erhalten, aber sind in ihrer syntax klar deklariert und typisiert
   * offenbar gibt es in scene.html die Scene, Entities, Components, Assets, Mixins, Requires... was ist das alles?
   * ich glaube, state ist nur in state/index.js direkt verfügbar, alles andere muss nachrichten senden und empfangen
 * zip-loader unterscheided nach "actual zip" und "pseudo zip", ich denke da ist noch was unsauber (z.B. die handhabung von "version")
 * auch unschön: komplette zips werden schon geladen und geparsed, wenn ich eigentlich nur das preview hören will. Das macht unnötigen traffic und cache pollution
 * manche abfolgen mit nur eingebauten songs sind kaputt:
   * eingebauten song spielen -> geht
   * Verlassen, nochmal spielen: geht nicht (forever loading)
   * Verlassen, anderen eingabeuten song wählen -> geht
   * Ersten song wieder wählen -> geht
 * Hit-sounds werden oft verspätet gespielt
 * Cover-laden macht noch CORS-Probleme, die aber kaum client-seitig lösbar sein werden. Ich könnte die Grafiken in ein `<img>` laden, aber wenn sie nicht mit ordentlichem CORS geladen wurden, kann ich unmöglich an die Inhalte kommen und diese an WebGL weiter geben.

# UI
Ich habe keine modernen UI-Frameworks für WebXR gefunden und würde daher gerne das UI in HTML bauen können. Es ist nicht direkt möglich, HTML im VR darzustellen. Die beste Näherung wäre wohl, das HTML in einen Canvas zu rendern und diesen darzustellen. Zwei Ansätze dazu:
 * https://github.com/mayognaise/aframe-html-shader/ hat bereits A-Frame integration, und rendert das HTML komplett selbst, was allerdings unvollständig ist
 * https://github.com/cburgmer/rasterizeHTML.js nutzt den Browser-DOM, und better HTML in SVG ein, um es zu zeichnen.
 * https://troisjs.github.io/ Nutzt VueJS um direkt Three.js Objekte zu erzeugen, aber hat an sich kein UI Toolkit

Ich würde gern Vue.js für das UI nutzen.

In `test3dui` hab ich eine Vuejs-Anwendung in einem verstecken div, das mit `rasterizeHTML.js` in ein Canvas gerendert wird. Es nimmt Mouse-Click- und -Move-Events an, und löst in der Vuejs-Anwendung wahlweise Click-Events aus, oder setzt pseudo-Klassen für Hover, bzw. entfernt diese wieder.

(Ich hab da noch Probleme, da die Library ihre Klassen nicht wieder entfernt, und das hinzufügen nicht klappt wenn ich mehrere Elemente angebe)

Ich müsste außerdem noch automatisch ein neues Rendering erstellen, wenn immer Vuejs den Dom updated.

# Mächste Schritte
Ich denke, ich kann nun eine Vue-Component machen, die ihren Inhalt in einen Canvas und somit in eine Canvas-Texture rendern kann, und der ich über Methodenaufrufe mitteilen kann, wo geklickt oder gehovert wurde. Über Params könnte man festlegen, ob sie sich und/oder ihren Canvas zusätzlich auch irgendwo sichtbar anzeigt, für's debugging.

Die Komponente sollte ihre eigene Größe und die des Canvas / der Textur am besten sinnvoll linken.

Dann bleibt noch die Frage, wie man mehrere solcher Components am besten gemeinsam nutzt, so dass Aktionen in einer auch eine Änderung in einer anderen hervorrufen. Da müsste ich Vue's Reactivity, das Statemanagement von Aframe, oder ggf. eine weitere State-Komponente irgendwie sinnvoll verbinden.

Momentan habe ich ja ein äußeres HTML das ohne Vue ist, und ein inneres HTML in einen iframe lädt, das dann Vue enthält. Der iframe wird ja vor allem für das Canvas-Rendering gebraucht, nicht aus Sicht von vue oder so. Mittels `<Teleport>` sollte ich Inhalte in den iframe bekommen.

# Audio
https://resonance-audio.github.io/resonance-audio/ macht einiges, müsste man testen.