App = {
  web3Provider: null,
  contracts: {},
	
  init: function() {
    $.getJSON('../real-estate.json', function(data) {
      var list = $('#list');
      var template = $('#template');

      for( i=0; i<data.length; i++) {
        template.find('img').attr('src',data[i].picture); // img는 태그라서 class와 다르게 .안붙임
        template.find('.id').text(data[i].id);
        template.find('.type').text(data[i].type);
        template.find('.area').text(data[i].area);
        template.find('.price').text(data[i].price);

        list.append(template.html());
      }
    });

    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      App.web3Provider = new web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON('RealEstate.json', function(data) {
      App.contracts.RealEstate = TruffleContract(data);
      App.contracts.RealEstate.setProvider(App.web3Provider);
      App.listenToEvents();
      // return App.loadRealEstates();
    });
  },

  buyRealEstate: function() {	
    var id = $('#id').val();
    var price = $('#price').val();
    var name = $('#name').val();
    var age = $('#age').val();

    //web3.eth.getAccounts(function(error, accounts) { // 강좌에서 알려주던 방식, 메타마스크가 버전업되면서 해당 기능을 제공하지 않고 다른 방식으로 해결
      //ethereum.enable().then(function(error,accounts) { // error 인자를 받을수 없게 되어서 빼버림
      ethereum.enable().then(function(accounts) { // 변경한 내용
      /*if (error) {
        console.log(error);
      }*/

      var account = accounts[0];
      console.log('트랜잭션 발행한 계정주소 = ' + accounts[0]);
      App.contracts.RealEstate.deployed().then(function(instance) { // 38줄과 같은 인스턴스
        var nameUtf8Encoded = utf8.encode(name);
        return instance.buyRealEstate(id, web3.toHex(nameUtf8Encoded), age, { from: account, value: price }); // 매입가(price)를 함수로 보낼 수 있음. 
        // 메타마스크로 account를 불러와야 함 --> 53줄
      }).then(function() {
        $('#name').val('');
        $('#age').val('');
        $('#buyModal').modal('hide');
        // return App.loadRealEstates(); // ListenToEvents가 초기에 설정해놓아서 항상 감시하기 때문에 + 거기서 App.loadRealEstate(); 실행함.
      }).catch(function(err) {
        console.log(err.message);
      });
    });
  },

  loadRealEstates: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getAllBuyers.call();
    }).then(function(buyers) {
      for (i = 0; i < buyers.length; i++) {
        if (buyers[i] !== '0x0000000000000000000000000000000000000000') { // null이 아닌 계정이 없을때 나타나는 주소
          // 0x0000~0이 아니다 => 주소가 있다 => 매물을 산 사람이 있다(팔렸다).
          var imgType = $('.panel-realEstate').eq(i).find('img').attr('src').substr(7); // json의 부동산 사진 이미지 이름 7자이후로받음

          switch(imgType) {
            case 'apartment.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/apartment_sold.jpg');
              break;
            case 'townhouse.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/townhouse_sold.jpg');
              break;
            case 'house.jpg':
              $('.panel-realEstate').eq(i).find('img').attr('src', 'images/house_sold.jpg');
              break;
          }

          $('.panel-realEstate').eq(i).find('.btn-buy').text('매각').attr('disabled', true); //매입을 매각으로, 버튼 비활성화
          $('.panel-realEstate').eq(i).find('.btn-buyerInfo').removeAttr('style');
        }    
      }
    }).catch(function(err) {
      console.log(err.message);
    })
  },
	
  listenToEvents: function() {
    App.contracts.RealEstate.deployed().then(function(instance) {
      instance.LogBuyRealEstate({}, { fromBlock: 0, toBlock: 'latest'}).watch(function(error, event) { // 모든 블록에서의 이벤트를 감지함.
        if(!error) {
          $('#events').append('<p>' + event.args._buyer + ' 계정에서 ' + event.args._id + '번 매물을 매입했습니다.' + '</p>');
        } else {
          console.error(error);
        }
        App.loadRealEstates();
      })
    })
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });

  $('#buyModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();
    var price = web3.toWei(parseFloat($(e.relatedTarget).parent().find('.price').text() || 0), "ether");


    $(e.currentTarget).find('#id').val(id);
    $(e.currentTarget).find('#price').val(price);
  });

  $('#buyerInfoModal').on('show.bs.modal', function(e) {
    var id = $(e.relatedTarget).parent().find('.id').text();

    App.contracts.RealEstate.deployed().then(function(instance) {
      return instance.getBuyerInfo.call(id);
    }).then(function(buyerInfo) {
      $(e.currentTarget).find('#buyerAddress').text(buyerInfo[0]);
      $(e.currentTarget).find('#buyerName').text(web3.toUtf8(buyerInfo[1])); // 한글깨짐으로 인한 web3에서 제공하는 utf8 변환 메소드
      $(e.currentTarget).find('#buyerAge').text(buyerInfo[2]);
    }).catch(function(err) {
      console.log(err.message);
    })
  });
});
