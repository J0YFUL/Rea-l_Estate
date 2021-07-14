// SPDX-License-Identifier: MIT
pragma solidity >=0.4.23 <0.9.0;

contract RealEstate {

    struct Buyer {
        address buyerAddress;
        bytes32 name;
        uint age;
    }

    mapping (uint => Buyer) public buyerInfo; // uint는 _id를 받아서 value값으로 Buyer 구조체

    address public owner;
    address[10] public buyers;

    event LogBuyRealEstate(
        address _buyer,
        uint _id
    ); // 이벤트가 생성됬을 때 내용도 블록에 저장된다.

    constructor() public {
        owner = msg.sender; // 현재 사용하는 계정으로 함수를 불러옴, 타입은 주소형
    }

    function buyRealEstate(uint _id, bytes32 _name, uint _age)  public payable {
        require(_id >= 0 && _id <= 9);
        buyers[_id] = msg.sender;
        buyerInfo[_id] = Buyer(msg.sender, _name, _age);

        owner.transfer(msg.value);
        emit LogBuyRealEstate(msg.sender, _id); // 이벤트 발생을 위한 emit
    }

    function getBuyerInfo(uint _id) public view returns (address, bytes32, uint) {
        Buyer memory buyer = buyerInfo[_id];
        return (buyer.buyerAddress, buyer.name, buyer.age);
    }

    function getAllBuyers() public view returns (address[10]) {
        return buyers;
    }
}
