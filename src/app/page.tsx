'use client'

import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import { getFile, uploadFile } from "./libs/storage";

const MAX_SMS_LENGTH = 160; // Maximum characters allowed for SMS

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploaded, setUploaded] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [isLoadingFileUpload, setIsLoadingFileUpload] = useState<boolean>(false);
  const [isLoadingSendMessage, setIsLoadingSendMessage] = useState<boolean>(false);
  const [isLoadingFetchBalance, setIsLoadingFetchBalance] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [smsCount, setSmsCount] = useState<number | null>(null);
  const [actionText, setActionText] = useState<string>("");

  const [selectedOption, setSelectedOption] = useState<string>("random");

  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    // Fetch balance when the component mounts
    fetchBalance();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e?.target?.files?.[0] || null;
    setSelectedFile(file);

    if (file) {
      const folder = "user/";
      setIsLoadingFileUpload(true);
      setActionText("Uploading file...");
      const imagePath = await uploadFile(file, folder);
      const imageUrl = await getFile(imagePath);
      setUploaded(imageUrl);
      setIsLoadingFileUpload(false);
      setActionText("File uploaded successfully");
    }
  };

  const handleSendMessage = async () => {
    if (!uploaded || !message) return;

    setIsLoadingSendMessage(true);
    setActionText("Sending message...");

    // Prepare the payload
    const payload = {
      excluded_msisdn: "",
      msg: message,
      public_url: uploaded,
      selected_option: selectedOption,
      rows_select: getRowsSelectValue()
    };

    // Send data to the API
    try {
      const response = await fetch("https://us-central1-bidleo-398811.cloudfunctions.net/Sendmsg-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      console.log("Message sent successfully");
      setActionText("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      setActionText(`Error sending message: ${error.message}`);
    } finally {
      setIsLoadingSendMessage(false);
    }
  };

  const fetchBalance = async () => {
    setIsLoadingFetchBalance(true);
    setActionText("Fetching balance...");

    try {
      const response = await fetch("https://us-central1-bidleo-398811.cloudfunctions.net/checksmsbalance");
      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }
      const data = await response.json();
      setBalance(data.balance);
      setSmsCount(data.sms_count);
      setActionText("Balance fetched successfully");
    } catch (error) {
      console.error("Error fetching balance:", error);
      setActionText(`Error fetching balance: ${error.message}`);
    } finally {
      setIsLoadingFetchBalance(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setMessage(text);
    setActionText(""); // Reset action text when user starts typing
  };

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(e.target.value);
  };

  const getRowsSelectValue = () => {
    switch (selectedOption) {
      case "random":
        return "random";
      case "all":
        return "all";
      case "half":
        return "half";
      default:
        return "random";
    }
  };

  return (
    <>
      <div className="container mx-auto mt-8 max-w-[560px]">
        <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-900 mb-4">
          <h1 className="text-3xl font-semibold">Bulk SMS</h1>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold">Check Balance</h2>
          <div className="flex items-center mt-4">
            <span className="mr-4">
              {balance !== null && smsCount !== null
                ? `Balance: ${balance}, SMS Count: ${smsCount}`
                : "Balance: Loading..."}
            </span>
          </div>
          <button
            className={`mt-2 bg-yellow-200 hover:bg-opacity-80 text-gray-600 rounded-lg px-4 py-2 duration-200 ${
              isLoadingFetchBalance ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            type="button"
            onClick={fetchBalance}
            disabled={isLoadingFetchBalance}
          >
            {isLoadingFetchBalance ? 'Refreshing...' : 'Refresh Balance'}
          </button>
        </div>

        <div className="flex justify-between items-center pb-4 border-b border-dashed border-gray-900 mb-4 mt-8">
          <h1 className="text-3xl font-semibold">Send Message</h1>
        </div>

        <input
          type="file"
          ref={inputRef}
          accept=".csv"
          onChange={handleFileChange}
          placeholder="Upload phone book"
        />
        <textarea
          className={`mt-5 w-full border rounded p-2 ${
            message.length > MAX_SMS_LENGTH ? 'border-red-500 text-red-500' : 'border-gray-500 text-black'
          }`}
          rows={4}
          placeholder="Enter your message here"
          value={message}
          onChange={handleTextChange}
        />
        <div className="text-right text-sm">
          {message.length}/{MAX_SMS_LENGTH} characters
        </div>

        <div className="mt-4">
          <div className="flex items-center mb-2">
            <input
              type="radio"
              id="random"
              name="smsOption"
              value="random"
              checked={selectedOption === "random"}
              onChange={handleOptionChange}
            />
            <label htmlFor="random" className="ml-2">Random Records</label>
          </div>
          <div className="flex items-center mb-2">
            <input
              type="radio"
              id="all"
              name="smsOption"
              value="all"
              checked={selectedOption === "all"}
              onChange={handleOptionChange}
            />
            <label htmlFor="all" className="ml-2">All Records</label>
          </div>
          <div className="flex items-center">
            <input
              type="radio"
              id="half"
              name="smsOption"
              value="half"
              checked={selectedOption === "half"}
              onChange={handleOptionChange}
            />
            <label htmlFor="half" className="ml-2">Half Records</label>
          </div>
        </div>

        <button
          className={`mt-5 bg-yellow-700 hover:bg-opacity-80 text-white rounded-lg px-4 py-2 duration-200 w-full ${
            isLoadingSendMessage || message.length > MAX_SMS_LENGTH || !uploaded ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          type="button"
          onClick={handleSendMessage}
          disabled={isLoadingSendMessage || message.length > MAX_SMS_LENGTH || !uploaded}
        >
          {isLoadingSendMessage ? 'Sending...' : 'Send Message'}
        </button> 

        <div className="mt-4 text-sm italic text-gray-500">
          {actionText}
        </div>
      </div>
      <Head>
        <title>Bulk SMS</title>
      </Head>
    </>
  );
}
