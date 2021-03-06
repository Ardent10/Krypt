import React , {useEffect, useState} from "react";
import {ethers} from "ethers";

import {contractABI, contractAddress} from "../utils/constants";

export const TransactionContext = React.createContext();
const {ethereum} = window;
window.ethereum 

const getEthereumContract=()=>{
    const provider            = new ethers.providers.Web3Provider(ethereum);
    const signer              = provider.getSigner();
    const transactionContract = new ethers.Contract(contractAddress,contractABI,signer);

    // console.log({
    //     provider,
    //     signer,
    //     transactionContract
    // });
    return transactionContract;
}

export const TransactionProvider = ({children})=>{

    const [currentAccount, setCurrentAccount] = useState('');
    const [formData, setFormData]             = useState({addressTo: "",amount:"", keyword: "", message: "" });
    const [isLoading, setLoading]              = useState(false);  
    const [transactionCount, setTrasactionCount] = useState(localStorage.getItem('transactionCount'));
    const [transactions, setTransactions] = useState([]);

    // form to send transaction
    const handleChange = (e,name)=>{
        setFormData((prevState)=>({
            ...prevState,
            [name]:e.target.value,
        }))
    }

    const getAllTransactions = async () =>{
        try {
            if(!ethereum) return alert("Please Install MetaMask");
            const transactionContract = getEthereumContract();
            const availableTransactions = await transactionContract.getAllTransactions();
            
            const structuredTransactions  = availableTransactions.map((transaction)=>({
                addressTo:transaction.reciever,
                addressFrom: transaction.sender,
                timestamp: new Date(transaction.timestamp.toNumber()*1000).toLocaleString(),
                message:transaction.message,
                keyword:transaction.keyword,
                amount:parseInt(transaction.amount._hex)/(10**18)
            })) 

            setTransactions(structuredTransactions);
            console.log(availableTransactions);
            console.log(structuredTransactions);
        } 
        catch (err) {
            console.log(err);
        }
    }  


    //Checking the wallet If MetaMask exists or not
    const CheckWallet = async ()=>{
       try {
           if(!ethereum){
               return alert("Please Install Metamask");
           }
           const accounts = await ethereum.request({method:'eth_accounts'});
           // console.log(accounts);
    
           if(accounts.length){
               setCurrentAccount(accounts[0]);
    
               getAllTransactions();
           }
           else
           {
               console.log("No account found");
           }
           
       } 
       catch (err) {
        console.log(err);    
       }
       
    }

    const checkIfTransactionExist = async ()=>{
        try {
            const transactionContract = getEthereumContract();
            const transactionCount = await transactionContract.getTransactionsCount();
            window.localStorage.setItem("transactionCount",transactionCount);
        } 
        catch (err) {
            console.log(err);    
            throw new Error("No ethereum Object.");
        }
    }


    //Connecting to MetaMask wallet
    const connectWallet = async()=>{
        try {
            if(!ethereum){
                return alert("Please Install Metamask");
            }
            const accounts = await ethereum.request({method:'eth_requestAccounts'});   
        
            setCurrentAccount(accounts[0]);
        } 
       catch (err) {
            console.log(err);  
            throw new Error("No ethereum Object.");  
        }
    }

    //Sending Transaction
    const sendTransaction = async ()=>{
        try {
            if(!ethereum){
                return alert("Please Install Metamask");
            }
            const {addressTo,amount,keyword,message} = formData;
            const transactionContract = getEthereumContract();
            const parsedAmount = ethers.utils.parseEther(amount);

            // sending ETH from one address to another
            await ethereum.request({
                method: "eth_sendTransaction",
                params: [{
                    from:currentAccount,
                    to: addressTo,
                    gas: '0x5208', // 21000GWEI = 0.000021ETH
                    value: parsedAmount._hex,    
                }]
            });

            const transactionHash = await transactionContract.addToBlockChain(addressTo,parsedAmount,message,keyword);
            
            setLoading(true); 
            console.log(`Loading- ${transactionHash.hash}`);
            await transactionHash.wait();
            
            setLoading(false); 
            console.log(`Success- ${transactionHash.hash}`);

            const transactionCount = await transactionContract.getTransactionsCount();
            setTrasactionCount(transactionCount.toNumber());
            
            window.reload();
        } 
        catch (err) {
            console.log(err);
            throw new Error("No ethereum Object");
        }
    }


    //Calling to checkWallet function
    useEffect(()=>{
        CheckWallet();
        checkIfTransactionExist();

    },[])


    //returning the context
    return (
        <TransactionContext.Provider value= {{connectWallet,currentAccount,formData,setFormData,handleChange,sendTransaction,transactions,isLoading}}>
         {children}
        </TransactionContext.Provider>
    );
}