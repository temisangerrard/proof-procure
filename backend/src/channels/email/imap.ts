import * as tls from "node:tls";

const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD || "";
const IMAP_HOST = "imap.gmail.com";
const IMAP_PORT = 993;

export interface EmailMessage {
  from: string;
  subject: string;
  body: string;
  uid: string;
}

/** Minimal IMAP fetch — connects to Gmail, grabs unseen messages, marks them read. */
export async function simpleImapFetch(): Promise<EmailMessage[]> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return [];

  return new Promise((resolve, reject) => {
    const messages: EmailMessage[] = [];
    let buffer = "";
    let state: "greeting" | "login" | "select" | "search" | "fetch" | "store" | "done" = "greeting";
    let unseenUids: string[] = [];
    let fetchIndex = 0;
    let currentMsg: Partial<EmailMessage> = {};
    let fetchingBody = false;
    let bodyLines: string[] = [];

    const socket = tls.connect({ host: IMAP_HOST, port: IMAP_PORT }, () => {
      // connected, wait for greeting
    });

    socket.setEncoding("utf8");
    socket.setTimeout(15_000);

    const send = (tag: string, cmd: string) => {
      socket.write(`${tag} ${cmd}\r\n`);
    };

    socket.on("data", (chunk: string) => {
      buffer += chunk;
      const lines = buffer.split("\r\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (state === "greeting" && line.startsWith("* OK")) {
          state = "login";
          send("A1", `LOGIN ${GMAIL_USER} ${GMAIL_APP_PASSWORD}`);
        } else if (state === "login" && line.startsWith("A1 OK")) {
          state = "select";
          send("A2", "SELECT INBOX");
        } else if (state === "login" && line.startsWith("A1 NO")) {
          socket.end();
          reject(new Error("IMAP login failed"));
        } else if (state === "select" && line.startsWith("A2 OK")) {
          state = "search";
          send("A3", "SEARCH UNSEEN");
        } else if (state === "search" && line.startsWith("* SEARCH")) {
          unseenUids = line.replace("* SEARCH", "").trim().split(/\s+/).filter(Boolean);
        } else if (state === "search" && line.startsWith("A3 OK")) {
          if (unseenUids.length === 0) {
            state = "done";
            send("A99", "LOGOUT");
          } else {
            state = "fetch";
            fetchIndex = 0;
            fetchNext();
          }
        } else if (state === "fetch") {
          if (fetchingBody) {
            if (line === ")" || line.match(/^\S+ OK/)) {
              currentMsg.body = bodyLines.join("\n");
              fetchingBody = false;
              if (currentMsg.from && currentMsg.body) {
                messages.push({
                  from: currentMsg.from,
                  subject: currentMsg.subject || "(no subject)",
                  body: currentMsg.body,
                  uid: unseenUids[fetchIndex - 1],
                });
              }
              // Mark as seen
              if (line.match(/^\S+ OK/)) {
                if (fetchIndex < unseenUids.length) {
                  fetchNext();
                } else {
                  state = "store";
                  const uidList = unseenUids.join(",");
                  send("A5", `STORE ${uidList} +FLAGS (\\Seen)`);
                }
              }
            } else {
              bodyLines.push(line);
            }
          } else {
            const fromMatch = line.match(/^From: (.+)/i);
            const subjectMatch = line.match(/^Subject: (.+)/i);
            if (fromMatch) {
              const emailMatch = fromMatch[1].match(/<([^>]+)>/) || [null, fromMatch[1].trim()];
              currentMsg.from = emailMatch[1];
            }
            if (subjectMatch) currentMsg.subject = subjectMatch[1].trim();
            if (line === "") {
              fetchingBody = true;
              bodyLines = [];
            }
          }
        } else if (state === "store" && line.startsWith("A5 OK")) {
          state = "done";
          send("A99", "LOGOUT");
        } else if (state === "done" && line.includes("BYE")) {
          socket.end();
        }
      }
    });

    const fetchNext = () => {
      currentMsg = {};
      fetchingBody = false;
      bodyLines = [];
      send("A4", `FETCH ${unseenUids[fetchIndex]} (BODY[HEADER.FIELDS (FROM SUBJECT)] BODY[TEXT])`);
      fetchIndex++;
    };

    socket.on("end", () => resolve(messages));
    socket.on("error", (err) => reject(err));
    socket.on("timeout", () => {
      socket.end();
      resolve(messages);
    });
  });
}

export function createImapTransport() { /* placeholder for future IMAP lib */ }
export function pollInbox() { /* placeholder */ }
