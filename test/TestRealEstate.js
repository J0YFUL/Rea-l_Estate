// 트러플은 mocha Test framework를 사용한다.
// 트러플은 assertion 모듈로 chai를 사용한다.

var RealEstate = artifacts.require("./RealEstate.sol");

contract('RealEstate', function(accounts) {
    var realEstateInstance;
    
    it("컨트랙의 소유자 초기화 테스팅", function() {
        return RealEstate.deployed().then(function(instance) {
            realEstateInstance = instance;
            return realEstateInstance.owner.call();
        }).then(function(owner) {
            assert.equal(owner.toUpperCase(), accounts[0].toUpperCase(),"owner가 가나슈 첫번째 계정과 동일하지 않음.");
                         //3가지를 받은(1.리턴될실제값,2.내가예상하는값,3.서로다를때에러메세지 정의)
        })
    });

    it("가나슈 두번째 계정으로 매물 아이디 0번 매입 후 이벤트 생성 및 매입자 정보와 buyers 배열 테스팅", function() {
        return RealEstate.deployed().then(function(instance) {
            realEstateInstance = instance;
            return realEstateInstance.buyRealEstate(0, "sejong", 13, {from: accounts[1], value: web3.toWei(1.50, "ether")});
        }).then(function(receipt) { // callback으로 받은 트랜잭션 영수증으로부터 이벤트 관련 assertion을 작성할수있다.
            assert.equal(receipt.logs.length, 1, "이벤트 하나가 생성되지 않았습니다.");
            assert.equal(receipt.logs[0].event, "LogBuyRealEstate", "이벤트가 LogBuyRealEstate가 아닙니다.");
            assert.equal(receipt.logs[0].args._buyer, accounts[1], "매입자가 가나슈 두번째 계정이 아닙니다.");
            assert.equal(receipt.logs[0].args._id, 0, "매물 아이디가 0이 아닙니다.");
            return realEstateInstance.getBuyerInfo(0);
        }).then(function(buyerInfo) {
            assert.equal(buyerInfo[0].toUpperCase(), accounts[1].toUpperCase(), "매입자의 계정이 가나슈 두번째 계정과 일치하지 않습니다." );
            assert.equal(web3.toAscii(buyerInfo[1]).replace(/\0/g,''), "sejong", "매입자의 이름이 sejong이 아닙니다.");
            assert.equal(buyerInfo[2], 13, "매입자의 나이가 13살이 아닙니다.");
            return realEstateInstance.getAllBuyers();
        }).then(function(buyers) {
            assert.equal(buyers[0].toUpperCase(), accounts[1].toUpperCase(), "Buyers 배열 첫번째 인덱스의 계정이 가나슈 두번째 계정과 일치하지 않습니다.");
        })
    })
});