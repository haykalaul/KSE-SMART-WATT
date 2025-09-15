import { FormEvent } from 'react';

type Props = {
    handleChat: (e: FormEvent<HTMLFormElement>) => void;
};

const ChatComponent: React.FC<Props> = ({ handleChat }) => {
  return (
    <form onSubmit={handleChat} className="absolute bottom-2 w-full">
      <div className="flex items-center">
        <textarea
          name="chat"
          id="chat"
          rows={1}
          className="block p-2.5 w-full text-sm rounded-lg border bg-gray-800 border-gray-600 placeholder-gray-400 text-white focus:ring-blue-500 focus:border-blue-500"
          placeholder="Your message..."
        ></textarea>
        <button
          type="submit"
          className="inline-flex justify-center ml-3 rounded-full cursor-pointer text-blue-500 hover:bg-gray-600"
        >
          <svg
            className="w-5 h-5 rotate-90 rtl:-rotate-90"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 18 20"
          >
            <path d="m17.914 18.594-8-18a1 1 0 0 0-1.828 0l-8 18a1 1 0 0 0 1.157 1.376L8 18.281V9a1 1 0 0 1 2 0v9.281l6.758 1.689a1 1 0 0 0 1.156-1.376Z" />
          </svg>
          <span className="sr-only">Send message</span>
        </button>
      </div>
    </form>
  );
};

export default ChatComponent;
