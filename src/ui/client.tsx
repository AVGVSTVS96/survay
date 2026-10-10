import "./app.css";

import { hydrateRoot } from "react-dom/client";

import { App, type Props } from "./app.tsx";

const props: Props = JSON.parse(document.getElementById("props")!.textContent);

hydrateRoot(document.getElementById("root")!, <App {...props} />);
