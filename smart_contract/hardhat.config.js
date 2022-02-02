require('@nomiclabs/hardhat-waffle');

module.exports={
  solidity: '0.8.0',
  networks:{
    ropsten:{
      url: 'https://eth-ropsten.alchemyapi.io/v2/biyQqTOgqX8etLk-TD4e1sWJO9Cl2uQ6',
      accounts: ['f58f95549388758a2472b3d02a224938dcfcd420000c023e296278b85aae33b4'], 
      
    }
  }
}