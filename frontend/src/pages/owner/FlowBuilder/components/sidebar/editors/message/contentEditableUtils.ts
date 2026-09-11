export const textToHtml = (text: string): string => {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const varRegex = /\{\{\{?(.*?)\}?\}\}/g;
  escaped = escaped.replace(varRegex, (_match, p1) => {
    const rawName = p1.trim();
    let displayName = rawName;
    if (rawName === 'first_name') displayName = 'First Name';
    else if (rawName === 'last_name') displayName = 'Last Name';
    else if (rawName === 'phone') displayName = 'Phone';
    else if (rawName === 'email') displayName = 'Email';
    else if (rawName === 'telegram_username') displayName = 'Telegram Username';
    else if (rawName === 'telegram_user_id') displayName = 'Telegram User ID';
    else if (rawName === 'contact_id') displayName = 'Contact Id';
    else if (rawName === 'subscribed') displayName = 'Subscribed';
    else if (rawName === 'chat_type') displayName = 'Chat Type';
    else if (rawName === 'chat_title') displayName = 'Chat Title';
    else if (rawName === 'chat_id') displayName = 'Chat ID';

    return `<span class="inline-flex items-center bg-blue-600 text-white rounded px-1.5 py-0.5 mx-0.5 font-bold text-[10px] select-none align-baseline" contenteditable="false" data-type="variable" data-val="${rawName}">${displayName}</span>`;
  });

  const mdLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
  escaped = escaped.replace(mdLinkRegex, (_match, p1, p2) => {
    return `<span class="text-blue-600 font-bold hover:underline cursor-pointer" contenteditable="false" data-type="link" data-url="${p2}">${p1}</span>`;
  });

  return escaped;
};

export const htmlToText = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const parseNode = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.nodeValue || '';
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      if (el.getAttribute('data-type') === 'variable') {
        const val = el.getAttribute('data-val') || '';
        return `{{${val}}}`;
      }
      if (el.getAttribute('data-type') === 'link') {
        const url = el.getAttribute('data-url') || '';
        const text = el.innerText || '';
        return `[${text}](${url})`;
      }
      if (el.tagName === 'BR') {
        return '\n';
      }
      if (el.tagName === 'DIV' || el.tagName === 'P') {
        let childText = '';
        for (let i = 0; i < el.childNodes.length; i++) {
          childText += parseNode(el.childNodes[i]);
        }
        return '\n' + childText;
      }

      let childText = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        childText += parseNode(el.childNodes[i]);
      }
      return childText;
    }
    return '';
  };

  let text = '';
  for (let i = 0; i < tempDiv.childNodes.length; i++) {
    text += parseNode(tempDiv.childNodes[i]);
  }
  return text.replace(/^\n/, '');
};
