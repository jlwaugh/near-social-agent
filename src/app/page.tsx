import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col p-2">
      <h1 className="text-3xl font-bold">Near Social Agent</h1>
      <ul>
        <li>
          <a
            href="https://docs.bitte.ai/agents/introduction"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </li>
        <li>
          <Link href="/.well-known/ai-plugin.json">
            OpenAPI Spec (work in progress)
          </Link>
        </li>
        <li>
          <Link href="/api/swagger">Swagger</Link>
        </li>
        <li>
          <a
            href="https://github.com/jlwaugh/near-social-agent"
            target="_blank"
            rel="noreferrer"
          >
            Source Code
          </a>
        </li>
      </ul>
    </main>
  );
}
